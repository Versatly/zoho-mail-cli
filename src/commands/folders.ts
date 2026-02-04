import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, isConfigured } from '../lib/config.js';
import { checkZohoConnection } from '../lib/auth.js';
import { getFolders, createFolder, deleteFolder } from '../lib/client.js';
import { formatFolders, success, error, warn } from '../lib/output.js';

function requireAuth(): void {
  const connection = checkZohoConnection();
  if (!connection) {
    error('Not connected to Zoho Mail');
    console.log(`  Run ${chalk.cyan('zoho-mail auth login')} to connect`);
    process.exit(1);
  }
}

function requireAccountId(): string {
  const config = getConfig();
  if (!config.accountId) {
    error('Account ID not set');
    console.log(`  Run ${chalk.cyan('zoho-mail auth set-account <accountId>')} to set it`);
    console.log(`  Or run ${chalk.cyan('zoho-mail accounts')} to list available accounts`);
    process.exit(1);
  }
  return config.accountId;
}

export function registerFoldersCommands(program: Command): void {
  const folders = program
    .command('folders')
    .description('Manage email folders');

  folders
    .command('list')
    .description('List all folders')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      requireAuth();
      const accountId = requireAccountId();
      
      const spinner = ora('Fetching folders...').start();
      
      try {
        const folderList = await getFolders(accountId);
        spinner.stop();
        console.log(formatFolders(folderList, options.json));
      } catch (err) {
        spinner.fail('Failed to fetch folders');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        
        // Provide helpful message about limitations
        console.log();
        warn('The Zoho Mail MCP integration via Pipedream has limited API support.');
        console.log(chalk.gray('To enable full folder management, we need one of:'));
        console.log(chalk.gray('  1. Extended MCP tools from Pipedream'));
        console.log(chalk.gray('  2. Direct OAuth token access'));
        console.log(chalk.gray('  3. IMAP integration (himalaya CLI)'));
        process.exit(1);
      }
    });

  folders
    .command('create')
    .description('Create a new folder')
    .argument('<name>', 'Folder name')
    .option('--parent <folderId>', 'Parent folder ID (for subfolders)')
    .option('--json', 'Output as JSON')
    .action(async (name, options) => {
      requireAuth();
      const accountId = requireAccountId();
      
      const spinner = ora(`Creating folder "${name}"...`).start();
      
      try {
        const folder = await createFolder(accountId, name, options.parent);
        spinner.succeed(`Created folder: ${folder.folderName}`);
        
        if (options.json) {
          console.log(JSON.stringify(folder, null, 2));
        } else {
          console.log(`  ${chalk.gray('Folder ID:')} ${folder.folderId}`);
          console.log(`  ${chalk.gray('Path:')} ${folder.path}`);
        }
      } catch (err) {
        spinner.fail('Failed to create folder');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  folders
    .command('delete')
    .description('Delete a folder')
    .argument('<folderId>', 'Folder ID to delete')
    .option('--force', 'Skip confirmation')
    .action(async (folderId, options) => {
      requireAuth();
      const accountId = requireAccountId();
      
      if (!options.force) {
        warn(`About to delete folder: ${folderId}`);
        console.log(chalk.yellow('This will permanently delete the folder and all emails in it.'));
        console.log();
        console.log('Run with --force to confirm.');
        return;
      }
      
      const spinner = ora('Deleting folder...').start();
      
      try {
        await deleteFolder(accountId, folderId);
        spinner.succeed('Folder deleted');
      } catch (err) {
        spinner.fail('Failed to delete folder');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  folders
    .command('rename')
    .description('Rename a folder')
    .argument('<folderId>', 'Folder ID')
    .argument('<newName>', 'New folder name')
    .action(async (folderId, newName) => {
      requireAuth();
      requireAccountId();
      
      error('Folder renaming requires direct API access (not yet implemented)');
      warn('The Zoho Mail MCP integration has limited functionality.');
      process.exit(1);
    });

  folders
    .command('move')
    .description('Move a folder')
    .argument('<folderId>', 'Folder ID to move')
    .argument('<parentId>', 'New parent folder ID')
    .action(async (folderId, parentId) => {
      requireAuth();
      requireAccountId();
      
      error('Folder moving requires direct API access (not yet implemented)');
      warn('The Zoho Mail MCP integration has limited functionality.');
      process.exit(1);
    });

  folders
    .command('empty')
    .description('Empty all emails from a folder')
    .argument('<folderId>', 'Folder ID to empty')
    .option('--force', 'Skip confirmation')
    .action(async (folderId, options) => {
      requireAuth();
      requireAccountId();
      
      if (!options.force) {
        warn(`About to empty folder: ${folderId}`);
        console.log(chalk.yellow('This will permanently delete all emails in the folder.'));
        console.log();
        console.log('Run with --force to confirm.');
        return;
      }
      
      error('Folder emptying requires direct API access (not yet implemented)');
      warn('The Zoho Mail MCP integration has limited functionality.');
      process.exit(1);
    });

  folders
    .command('mark-read')
    .description('Mark all emails in folder as read')
    .argument('<folderId>', 'Folder ID')
    .action(async (folderId) => {
      requireAuth();
      requireAccountId();
      
      error('Mark as read requires direct API access (not yet implemented)');
      warn('The Zoho Mail MCP integration has limited functionality.');
      process.exit(1);
    });
}
