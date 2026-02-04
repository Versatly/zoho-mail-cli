import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig } from '../lib/config.js';
import { checkZohoConnection } from '../lib/auth.js';
import {
  getEmails,
  getEmailContent,
  searchEmails,
  sendEmail,
  updateMessage,
  deleteEmail,
  getAccountId,
  getFolders,
} from '../lib/client.js';
import { formatEmails, formatEmailContent, success, error, warn } from '../lib/output.js';

function requireAuth(): void {
  const connection = checkZohoConnection();
  if (!connection) {
    error('Not connected to Zoho Mail');
    console.log(`  Run ${chalk.cyan('zoho-mail auth login')} to connect`);
    process.exit(1);
  }
}

async function ensureAccountId(): Promise<string> {
  const config = getConfig();
  if (config.accountId) {
    return config.accountId;
  }

  try {
    const accountId = await getAccountId();
    setConfig({ accountId });
    return accountId;
  } catch (err) {
    error('Could not detect account ID');
    process.exit(1);
  }
}

async function getInboxFolderId(accountId: string): Promise<string> {
  const folders = await getFolders(accountId);
  const inbox = folders.find(f => f.folderType === 'Inbox');
  if (!inbox) {
    throw new Error('Inbox folder not found');
  }
  return inbox.folderId;
}

export function registerMailCommands(program: Command): void {
  const mail = program
    .command('mail')
    .description('Email operations');

  mail
    .command('list')
    .description('List emails in a folder')
    .argument('[folderId]', 'Folder ID (default: Inbox)')
    .option('-n, --limit <number>', 'Max emails to fetch', '20')
    .option('--unread', 'Only unread emails')
    .option('--flagged', 'Only flagged emails')
    .option('--from <email>', 'Filter by sender')
    .option('--subject <text>', 'Filter by subject')
    .option('--json', 'Output as JSON')
    .action(async (folderId, options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Fetching emails...').start();

      try {
        // Get Inbox folder ID if not specified
        const targetFolderId = folderId || await getInboxFolderId(accountId);

        const emails = await getEmails(accountId, targetFolderId, {
          limit: parseInt(options.limit, 10),
          status: options.unread ? 'unread' : undefined,
          flagged: options.flagged,
        });

        spinner.stop();

        // Apply client-side filters if needed
        let filtered = emails;
        if (options.from) {
          filtered = filtered.filter(e =>
            e.fromAddress.toLowerCase().includes(options.from.toLowerCase())
          );
        }
        if (options.subject) {
          filtered = filtered.filter(e =>
            e.subject.toLowerCase().includes(options.subject.toLowerCase())
          );
        }

        if (filtered.length === 0) {
          console.log(chalk.gray('No emails found'));
        } else {
          console.log(formatEmails(filtered, options.json));
          console.log();
          console.log(chalk.gray(`Showing ${filtered.length} email(s)`));
        }
      } catch (err) {
        spinner.fail('Failed to fetch emails');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('read')
    .description('Read email content')
    .argument('<messageId>', 'Message ID')
    .option('--folder <folderId>', 'Folder ID containing the email')
    .option('--headers', 'Include email headers')
    .option('--raw', 'Show raw/original message')
    .option('--json', 'Output as JSON')
    .action(async (messageId, options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Fetching email content...').start();

      try {
        const folderId = options.folder || await getInboxFolderId(accountId);
        const email = await getEmailContent(accountId, folderId, messageId);
        spinner.stop();

        if (options.json) {
          console.log(JSON.stringify(email, null, 2));
        } else {
          console.log(formatEmailContent(email as any));
        }
      } catch (err) {
        spinner.fail('Failed to fetch email');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('search')
    .description('Search emails')
    .argument('<query>', 'Search query')
    .option('-n, --limit <number>', 'Max results', '50')
    .option('--folder <folderId>', 'Search in specific folder')
    .option('--json', 'Output as JSON')
    .action(async (query, options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora(`Searching for "${query}"...`).start();

      try {
        const emails = await searchEmails(accountId, query, {
          limit: parseInt(options.limit, 10),
          folderId: options.folder,
        });

        spinner.stop();

        if (emails.length === 0) {
          console.log(chalk.gray('No emails found'));
        } else {
          console.log(formatEmails(emails, options.json));
          console.log();
          console.log(chalk.gray(`Found ${emails.length} email(s)`));
        }
      } catch (err) {
        spinner.fail('Search failed');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('send')
    .description('Send an email')
    .option('--to <email>', 'Recipient email address (required)')
    .option('--cc <email>', 'CC recipient')
    .option('--bcc <email>', 'BCC recipient')
    .option('--subject <text>', 'Email subject (required)')
    .option('--body <text>', 'Email body (required)')
    .option('--html', 'Treat body as HTML')
    .option('--attach <file>', 'Attachment path')
    .action(async (options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      // Validate required fields
      if (!options.to) {
        error('--to is required');
        process.exit(1);
      }
      if (!options.subject) {
        error('--subject is required');
        process.exit(1);
      }
      if (!options.body) {
        error('--body is required');
        process.exit(1);
      }

      if (options.attach) {
        error('Attachments not yet supported');
        process.exit(1);
      }

      const spinner = ora(`Sending email to ${options.to}...`).start();

      try {
        await sendEmail(accountId, {
          to: options.to,
          cc: options.cc,
          bcc: options.bcc,
          subject: options.subject,
          content: options.body,
          isHtml: options.html,
        });

        spinner.succeed('Email sent!');
      } catch (err) {
        spinner.fail('Failed to send email');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('move')
    .description('Move email to folder')
    .argument('<messageId>', 'Message ID')
    .argument('<folderId>', 'Target folder ID')
    .action(async (messageId, folderId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Moving email...').start();

      try {
        await updateMessage(accountId, messageId, {
          mode: 'moveToFolder',
          folderId,
        });
        spinner.succeed('Email moved');
      } catch (err) {
        spinner.fail('Failed to move email');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('delete')
    .description('Delete an email')
    .argument('<messageId>', 'Message ID')
    .option('--folder <folderId>', 'Folder containing the email')
    .option('--force', 'Skip confirmation')
    .action(async (messageId, options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      if (!options.force) {
        warn(`About to delete email: ${messageId}`);
        console.log('Run with --force to confirm.');
        return;
      }

      const spinner = ora('Deleting email...').start();

      try {
        const folderId = options.folder || await getInboxFolderId(accountId);
        await deleteEmail(accountId, folderId, messageId);
        spinner.succeed('Email deleted');
      } catch (err) {
        spinner.fail('Failed to delete email');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('flag')
    .description('Flag/star an email')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Flagging email...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'addFlag' });
        spinner.succeed('Email flagged');
      } catch (err) {
        spinner.fail('Failed to flag email');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('unflag')
    .description('Remove flag from email')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Removing flag...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'removeFlag' });
        spinner.succeed('Flag removed');
      } catch (err) {
        spinner.fail('Failed to remove flag');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('archive')
    .description('Archive an email')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Archiving email...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'archive' });
        spinner.succeed('Email archived');
      } catch (err) {
        spinner.fail('Failed to archive email');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('spam')
    .description('Mark email as spam')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Marking as spam...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'spam' });
        spinner.succeed('Marked as spam');
      } catch (err) {
        spinner.fail('Failed to mark as spam');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('unspam')
    .description('Mark email as not spam')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Unmarking spam...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'notSpam' });
        spinner.succeed('Unmarked as spam');
      } catch (err) {
        spinner.fail('Failed to unmark spam');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('mark-read')
    .description('Mark email as read')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Marking as read...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'markAsRead' });
        spinner.succeed('Marked as read');
      } catch (err) {
        spinner.fail('Failed to mark as read');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('mark-unread')
    .description('Mark email as unread')
    .argument('<messageId>', 'Message ID')
    .action(async (messageId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Marking as unread...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'markAsUnread' });
        spinner.succeed('Marked as unread');
      } catch (err) {
        spinner.fail('Failed to mark as unread');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('label')
    .description('Apply label to email')
    .argument('<messageId>', 'Message ID')
    .argument('<labelId>', 'Label ID')
    .action(async (messageId, labelId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Applying label...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'addTag', tagId: labelId });
        spinner.succeed('Label applied');
      } catch (err) {
        spinner.fail('Failed to apply label');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  mail
    .command('unlabel')
    .description('Remove label from email')
    .argument('<messageId>', 'Message ID')
    .argument('<labelId>', 'Label ID')
    .action(async (messageId, labelId) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Removing label...').start();

      try {
        await updateMessage(accountId, messageId, { mode: 'removeTag', tagId: labelId });
        spinner.succeed('Label removed');
      } catch (err) {
        spinner.fail('Failed to remove label');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });
}
