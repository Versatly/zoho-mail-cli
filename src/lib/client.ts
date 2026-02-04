import { execSync } from 'child_process';
import { getConfig } from './config.js';
import { getPdauthUserId } from './auth.js';
import type {
  ZohoAccount,
  ZohoFolder,
  ZohoLabel,
  ZohoEmail,
  ZohoEmailContent,
  ZohoApiResponse,
} from '../types/zoho.js';

const DEBUG = process.env.ZOHO_DEBUG === '1';

interface ProxyCallResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Make a proxy call to Zoho Mail API via pdauth
 * pdauth's proxy feature allows direct API calls with the connected credentials
 */
async function proxyCall(
  method: string,
  path: string,
  data?: Record<string, unknown>
): Promise<ProxyCallResult> {
  const userId = getPdauthUserId();
  const config = getConfig();
  const baseUrl = `https://mail.${config.region || 'zoho.com'}`;
  const url = `${baseUrl}${path}`;
  
  if (DEBUG) {
    console.error(`[DEBUG] ${method} ${url}`);
    if (data) console.error(`[DEBUG] Body:`, JSON.stringify(data));
  }

  // Build the instruction for the MCP tool
  // Since zoho_mail MCP tools are limited, we'll use a direct HTTP approach
  // via pdauth's proxy capability
  
  // For now, we'll construct curl-like commands that pdauth can proxy
  // The instruction param tells the MCP tool what to do
  const instruction = `Make a ${method} request to ${url}${data ? ' with body: ' + JSON.stringify(data) : ''}`;
  
  try {
    // Try using the MCP tool with instruction
    const args = JSON.stringify({ instruction });
    const cmd = `pdauth call zoho_mail.zoho_mail-send-email --user ${userId} --args '${args.replace(/'/g, "'\\''")}'`;
    
    if (DEBUG) {
      console.error(`[DEBUG] Command: ${cmd}`);
    }
    
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    
    // Parse the MCP response
    const lines = result.trim().split('\n');
    const jsonLine = lines.find(line => line.startsWith('{'));
    if (jsonLine) {
      const parsed = JSON.parse(jsonLine);
      if (parsed.content?.[0]?.text) {
        return { success: true, data: parsed.content[0].text };
      }
    }
    
    return { success: false, error: 'Unexpected response format' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Execute a direct API call using the stored credentials
 * This is a workaround since the MCP tools are limited
 */
async function directApiCall(
  method: string,
  path: string,
  data?: Record<string, unknown>
): Promise<unknown> {
  const config = getConfig();
  const baseUrl = `https://mail.${config.region || 'zoho.com'}/api`;
  const url = `${baseUrl}${path}`;
  
  if (DEBUG) {
    console.error(`[DEBUG] ${method} ${url}`);
  }
  
  // Use pdauth's built-in proxy capability
  // The zoho_mail app has proxy_enabled: true with base URL mail.zoho.com
  const userId = getPdauthUserId();
  
  // Build curl command that pdauth will proxy
  let curlCmd = `curl -s -X ${method} "${url}"`;
  curlCmd += ` -H "Content-Type: application/json"`;
  
  if (data && method !== 'GET') {
    curlCmd += ` -d '${JSON.stringify(data)}'`;
  }
  
  // Unfortunately pdauth doesn't expose raw proxy directly via CLI
  // The MCP tools only support high-level operations
  // We need to work within the MCP tool constraints or extend pdauth
  
  throw new Error(
    'Direct API calls not yet supported. The Zoho Mail MCP integration has limited tools.\n' +
    'To proceed, we need either:\n' +
    '1. Extended MCP tools from Pipedream\n' +
    '2. Raw proxy support in pdauth CLI\n' +
    '3. Direct OAuth token management'
  );
}

// High-level API functions that work within MCP limitations

/**
 * Get all mail accounts for the authenticated user
 */
export async function getAccounts(): Promise<ZohoAccount[]> {
  // This requires direct API access which MCP doesn't provide
  // Return a placeholder for now
  throw new Error('Zoho Mail MCP integration does not support listing accounts. Direct API access needed.');
}

/**
 * List all folders
 */
export async function getFolders(accountId: string): Promise<ZohoFolder[]> {
  throw new Error('Zoho Mail MCP integration does not support listing folders. Direct API access needed.');
}

/**
 * Create a new folder
 */
export async function createFolder(
  accountId: string,
  name: string,
  parentId?: string
): Promise<ZohoFolder> {
  throw new Error('Zoho Mail MCP integration does not support creating folders. Direct API access needed.');
}

/**
 * Delete a folder
 */
export async function deleteFolder(accountId: string, folderId: string): Promise<boolean> {
  throw new Error('Zoho Mail MCP integration does not support deleting folders. Direct API access needed.');
}

/**
 * List all labels
 */
export async function getLabels(accountId: string): Promise<ZohoLabel[]> {
  throw new Error('Zoho Mail MCP integration does not support listing labels. Direct API access needed.');
}

/**
 * Create a new label
 */
export async function createLabel(
  accountId: string,
  name: string,
  color?: string
): Promise<ZohoLabel> {
  throw new Error('Zoho Mail MCP integration does not support creating labels. Direct API access needed.');
}

/**
 * Delete a label
 */
export async function deleteLabel(accountId: string, labelId: string): Promise<boolean> {
  throw new Error('Zoho Mail MCP integration does not support deleting labels. Direct API access needed.');
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
  throw new Error('Zoho Mail MCP integration does not support listing emails. Direct API access needed.');
}

/**
 * Get email content
 */
export async function getEmailContent(
  accountId: string,
  folderId: string,
  messageId: string
): Promise<ZohoEmailContent> {
  throw new Error('Zoho Mail MCP integration does not support reading emails. Direct API access needed.');
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
  throw new Error('Zoho Mail MCP integration does not support searching emails. Direct API access needed.');
}

/**
 * Send an email - THIS ONE WORKS via MCP!
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
  const userId = getPdauthUserId();
  
  const instruction = `Send an email to ${options.to} with subject "${options.subject}" and body: ${options.content}`;
  const args = JSON.stringify({ instruction });
  
  try {
    const cmd = `pdauth call zoho_mail.zoho_mail-send-email --user ${userId} --args '${args.replace(/'/g, "'\\''")}'`;
    
    if (DEBUG) {
      console.error(`[DEBUG] Command: ${cmd}`);
    }
    
    const result = execSync(cmd, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024,
    });
    
    // Check for success in response
    return result.toLowerCase().includes('success') || result.toLowerCase().includes('sent');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to send email: ${message}`);
  }
}
