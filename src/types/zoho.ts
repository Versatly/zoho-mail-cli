// Zoho Mail API Types

export interface ZohoConfig {
  region: string;
  accountId: string;
  userId: string;
  defaultFolder?: string;
}

export interface ZohoAccount {
  accountId: string;
  emailAddress: string;
  displayName: string;
  incoming: boolean;
  outgoing: boolean;
  role: string;
  type: string;
}

export interface ZohoFolder {
  folderId: string;
  folderName: string;
  folderType: string;
  path: string;
  isArchived: number;
  imapAccess: boolean;
  URI: string;
  previousFolderId?: string;
  unreadCount?: number;
  totalCount?: number;
}

export interface ZohoLabel {
  labelId: string;
  labelName: string;
  color: string;
}

export interface ZohoEmail {
  messageId: string;
  folderId: string;
  subject: string;
  sender: string;
  fromAddress: string;
  toAddress: string;
  ccAddress?: string;
  receivedTime: number;
  sentDateInGMT: number;
  status: string;
  status2: string;
  hasAttachment: boolean;
  flagid: string;
  summary: string;
  priority?: string;
  labels?: string[];
  threadId?: string;
  threadCount?: number;
}

export interface ZohoEmailContent {
  messageId: string;
  folderId: string;
  subject: string;
  fromAddress: string;
  toAddress: string;
  ccAddress?: string;
  bccAddress?: string;
  content: string;
  htmlContent?: string;
  receivedTime: number;
  hasAttachment: boolean;
  attachments?: ZohoAttachment[];
}

export interface ZohoAttachment {
  attachmentId: string;
  attachmentName: string;
  attachmentSize: number;
  contentType: string;
}

export interface ZohoSignature {
  signatureId: string;
  signatureName: string;
  content: string;
  mode: string;
  isDefault: boolean;
}

export interface ZohoApiResponse<T> {
  status: {
    code: number;
    description: string;
  };
  data: T;
}

export interface ZohoApiError {
  status: {
    code: number;
    description: string;
  };
  data?: {
    errorCode?: string;
    message?: string;
  };
}

// Command Options
export interface ListMailOptions {
  limit?: number;
  unread?: boolean;
  flagged?: boolean;
  from?: string;
  subject?: string;
  json?: boolean;
}

export interface SearchMailOptions {
  limit?: number;
  folder?: string;
  json?: boolean;
}

export interface SendMailOptions {
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  html?: boolean;
  attach?: string;
}
