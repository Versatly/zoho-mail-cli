import Table from 'cli-table3';
import chalk from 'chalk';
import type { ZohoFolder, ZohoLabel, ZohoEmail, ZohoAccount } from '../types/zoho.js';

export function formatAccounts(accounts: ZohoAccount[], json: boolean = false): string {
  if (json) {
    return JSON.stringify(accounts, null, 2);
  }

  const table = new Table({
    head: [
      chalk.cyan('Account ID'),
      chalk.cyan('Email'),
      chalk.cyan('Display Name'),
      chalk.cyan('Type'),
    ],
    style: { head: [], border: [] },
  });

  for (const account of accounts) {
    table.push([
      account.accountId,
      account.emailAddress,
      account.displayName || '-',
      account.type || '-',
    ]);
  }

  return table.toString();
}

export function formatFolders(folders: ZohoFolder[], json: boolean = false): string {
  if (json) {
    return JSON.stringify(folders, null, 2);
  }

  const table = new Table({
    head: [
      chalk.cyan('Folder ID'),
      chalk.cyan('Name'),
      chalk.cyan('Type'),
      chalk.cyan('Path'),
      chalk.cyan('Unread'),
    ],
    style: { head: [], border: [] },
  });

  for (const folder of folders) {
    const typeIcon = getFolderIcon(folder.folderType);
    table.push([
      folder.folderId,
      `${typeIcon} ${folder.folderName}`,
      folder.folderType,
      folder.path,
      folder.unreadCount?.toString() || '-',
    ]);
  }

  return table.toString();
}

function getFolderIcon(type: string): string {
  const icons: Record<string, string> = {
    Inbox: '📥',
    Sent: '📤',
    Drafts: '📝',
    Trash: '🗑️',
    Spam: '🚫',
    Outbox: '📬',
    Templates: '📋',
    Snoozed: '⏰',
  };
  return icons[type] || '📁';
}

export function formatLabels(labels: ZohoLabel[], json: boolean = false): string {
  if (json) {
    return JSON.stringify(labels, null, 2);
  }

  const table = new Table({
    head: [
      chalk.cyan('Label ID'),
      chalk.cyan('Name'),
      chalk.cyan('Color'),
    ],
    style: { head: [], border: [] },
  });

  for (const label of labels) {
    const colorBox = label.color ? chalk.hex(label.color)('■') : '-';
    table.push([
      label.labelId,
      label.labelName,
      colorBox,
    ]);
  }

  return table.toString();
}

export function formatEmails(emails: ZohoEmail[], json: boolean = false): string {
  if (json) {
    return JSON.stringify(emails, null, 2);
  }

  const table = new Table({
    head: [
      chalk.cyan('ID'),
      chalk.cyan('From'),
      chalk.cyan('Subject'),
      chalk.cyan('Date'),
      chalk.cyan('Status'),
    ],
    style: { head: [], border: [] },
    colWidths: [20, 25, 40, 20, 10],
    wordWrap: true,
  });

  for (const email of emails) {
    // receivedTime can be a string (milliseconds) or number
    const timestamp = typeof email.receivedTime === 'string' 
      ? parseInt(email.receivedTime, 10) 
      : email.receivedTime;
    const date = new Date(timestamp).toLocaleString();
    const status = getEmailStatusIcon(email);
    const subject = email.subject || '(no subject)';
    
    table.push([
      email.messageId.substring(0, 18) + '...',
      truncate(email.fromAddress, 23),
      truncate(subject, 38),
      date,
      status,
    ]);
  }

  return table.toString();
}

function getEmailStatusIcon(email: ZohoEmail): string {
  let icons = '';
  // status '0' = unread, '1' = read
  if (email.status === '0' || email.status2 === '0') {
    icons += '●';
  }
  if (email.flagid && email.flagid !== 'flag_not_set' && email.flagid !== '0') {
    icons += '⭐';
  }
  // hasAttachment can be boolean, string "0"/"1", or "true"/"false"
  const hasAtt = email.hasAttachment;
  if (hasAtt === true || hasAtt === '1' || hasAtt === 'true') {
    icons += '📎';
  }
  return icons || '-';
}

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length - 3) + '...';
}

export function formatEmailContent(email: ZohoEmail & { content?: string }): string {
  const divider = chalk.gray('─'.repeat(60));
  
  let output = `
${divider}
${chalk.bold('From:')} ${email.fromAddress}
${chalk.bold('To:')} ${email.toAddress}
${email.ccAddress ? chalk.bold('Cc:') + ' ' + email.ccAddress + '\n' : ''}${chalk.bold('Date:')} ${new Date(email.receivedTime).toLocaleString()}
${chalk.bold('Subject:')} ${email.subject || '(no subject)'}
${divider}

${email.content || email.summary || '(no content)'}

${divider}
`;

  return output;
}

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warn(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}
