import { execSync } from 'child_process';
import { getConfig } from './config.js';
import { getPdauthUserId } from './auth.js';
import type {
  ZohoAccount,
  ZohoFolder,
  ZohoLabel,
  ZohoEmail,
  ZohoEmailContent,
} from '../types/zoho.js';

const DEBUG = process.env.ZOHO_DEBUG === '1';

interface ZohoApiResponse<T> {
  status: {
    code: number;
    description: string;
  };
  data: T;
}

/**
 * Make a proxy call to Zoho Mail API via pdauth
 */
async function proxyCall<T>(
  method: string,
  path: string,
  options?: {
    query?: Record<string, string>;
    data?: Record<string, unknown>;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const userId = getPdauthUserId();

  // Build command
  let cmd = `pdauth proxy zoho_mail "${path}" --user ${userId} -X ${method}`;

  // Add query params
  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      cmd += ` -q "${key}=${value}"`;
    }
  }

  // Add data
  if (options?.data) {
    const jsonData = JSON.stringify(options.data).replace(/'/g, "'\\''");
    cmd += ` -d '${jsonData}'`;
  }

  // Add headers
  if (options?.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      cmd += ` -H "${key}: ${value}"`;
    }
  }

  if (DEBUG) {
    console.error(`[DEBUG] ${cmd}`);
  }

  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Find the JSON in the output (skip spinner lines)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON response from API');
    }

    const response = JSON.parse(jsonMatch[0]) as ZohoApiResponse<T>;

    if (response.status.code !== 200) {
      throw new Error(`API error: ${response.status.description}`);
    }

    return response.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (DEBUG) {
      console.error(`[DEBUG] Error: ${message}`);
    }
    throw new Error(`Zoho API call failed: ${message}`);
  }
}

/**
 * Get all mail accounts for the authenticated user
 */
export async function getAccounts(): Promise<ZohoAccount[]> {
  const data = await proxyCall<ZohoAccount[]>('GET', '/api/accounts');
  return data;
}

/**
 * Get account ID (first account)
 */
export async function getAccountId(): Promise<string> {
  const accounts = await getAccounts();
  if (accounts.length === 0) {
    throw new Error('No Zoho Mail accounts found');
  }
  return accounts[0].accountId;
}

/**
 * List all folders
 */
export async function getFolders(accountId: string): Promise<ZohoFolder[]> {
  return proxyCall<ZohoFolder[]>('GET', `/api/accounts/${accountId}/folders`);
}

/**
 * Create a new folder
 */
export async function createFolder(
  accountId: string,
  name: string,
  parentId?: string
): Promise<ZohoFolder> {
  const data: Record<string, unknown> = { folderName: name };
  if (parentId) {
    data.parentFolderId = parentId;
  }
  return proxyCall<ZohoFolder>('POST', `/api/accounts/${accountId}/folders`, { data });
}

/**
 * Delete a folder
 */
export async function deleteFolder(accountId: string, folderId: string): Promise<boolean> {
  await proxyCall<unknown>('DELETE', `/api/accounts/${accountId}/folders/${folderId}`);
  return true;
}

/**
 * Rename a folder
 */
export async function renameFolder(
  accountId: string,
  folderId: string,
  newName: string
): Promise<ZohoFolder> {
  return proxyCall<ZohoFolder>('PUT', `/api/accounts/${accountId}/folders/${folderId}`, {
    data: { mode: 'renameFolder', folderName: newName },
  });
}

/**
 * List all labels
 */
export async function getLabels(accountId: string): Promise<ZohoLabel[]> {
  return proxyCall<ZohoLabel[]>('GET', `/api/accounts/${accountId}/labels`);
}

/**
 * Create a new label
 */
export async function createLabel(
  accountId: string,
  name: string,
  color?: string
): Promise<ZohoLabel> {
  const data: Record<string, unknown> = { labelName: name };
  if (color) {
    data.color = color;
  }
  return proxyCall<ZohoLabel>('POST', `/api/accounts/${accountId}/labels`, { data });
}

/**
 * Delete a label
 */
export async function deleteLabel(accountId: string, labelId: string): Promise<boolean> {
  await proxyCall<unknown>('DELETE', `/api/accounts/${accountId}/labels/${labelId}`);
  return true;
}

/**
 * List emails in a folder
 */
export async function getEmails(
  accountId: string,
  folderId: string,
  options?: {
    limit?: number;
    start?: number;
    status?: 'read' | 'unread';
    flagged?: boolean;
  }
): Promise<ZohoEmail[]> {
  const query: Record<string, string> = {
    folderId,
    limit: String(options?.limit || 50),
  };

  if (options?.start) {
    query.start = String(options.start);
  }
  if (options?.status) {
    query.status = options.status === 'unread' ? '0' : '1';
  }
  if (options?.flagged) {
    query.flagid = 'flagged';
  }

  return proxyCall<ZohoEmail[]>('GET', `/api/accounts/${accountId}/messages/view`, { query });
}

/**
 * Get email content
 */
export async function getEmailContent(
  accountId: string,
  folderId: string,
  messageId: string
): Promise<ZohoEmailContent> {
  return proxyCall<ZohoEmailContent>(
    'GET',
    `/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}/content`
  );
}

/**
 * Search emails
 */
export async function searchEmails(
  accountId: string,
  query: string,
  options?: {
    limit?: number;
    folderId?: string;
  }
): Promise<ZohoEmail[]> {
  const params: Record<string, string> = {
    searchKey: query,
    limit: String(options?.limit || 50),
  };

  if (options?.folderId) {
    params.folderId = options.folderId;
  }

  return proxyCall<ZohoEmail[]>('GET', `/api/accounts/${accountId}/messages/search`, {
    query: params,
  });
}

/**
 * Send an email
 */
export async function sendEmail(
  accountId: string,
  options: {
    to: string;
    subject: string;
    content: string;
    cc?: string;
    bcc?: string;
    isHtml?: boolean;
  }
): Promise<boolean> {
  const data: Record<string, unknown> = {
    toAddress: options.to,
    subject: options.subject,
    content: options.content,
    mailFormat: options.isHtml ? 'html' : 'plaintext',
  };

  if (options.cc) data.ccAddress = options.cc;
  if (options.bcc) data.bccAddress = options.bcc;

  await proxyCall<unknown>('POST', `/api/accounts/${accountId}/messages`, { data });
  return true;
}

/**
 * Update message (move, flag, label, read/unread, archive, spam)
 */
export async function updateMessage(
  accountId: string,
  messageId: string,
  action: {
    mode: 'markAsRead' | 'markAsUnread' | 'moveToFolder' | 'addFlag' | 'removeFlag' |
          'addTag' | 'removeTag' | 'archive' | 'unarchive' | 'spam' | 'notSpam';
    folderId?: string;
    tagId?: string;
  }
): Promise<boolean> {
  const data: Record<string, unknown> = {
    mode: action.mode,
    messageId: [messageId],
  };

  if (action.folderId) data.destFolderId = action.folderId;
  if (action.tagId) data.tagId = action.tagId;

  await proxyCall<unknown>('PUT', `/api/accounts/${accountId}/updatemessage`, { data });
  return true;
}

/**
 * Delete an email
 */
export async function deleteEmail(
  accountId: string,
  folderId: string,
  messageId: string
): Promise<boolean> {
  await proxyCall<unknown>(
    'DELETE',
    `/api/accounts/${accountId}/folders/${folderId}/messages/${messageId}`
  );
  return true;
}
