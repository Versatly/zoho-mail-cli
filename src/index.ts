#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { registerAuthCommands } from './commands/auth.js';
import { registerFoldersCommands } from './commands/folders.js';
import { registerLabelsCommands } from './commands/labels.js';
import { registerMailCommands } from './commands/mail.js';

const program = new Command();

program
  .name('zoho-mail')
  .description('Powerful CLI for Zoho Mail - inbox management, folders, labels, and email operations')
  .version('1.0.0');

// Register command groups
registerAuthCommands(program);
registerFoldersCommands(program);
registerLabelsCommands(program);
registerMailCommands(program);

// Global options
program.option('--debug', 'Enable debug mode');

// Parse and handle debug mode
program.hook('preAction', (thisCommand) => {
  if (thisCommand.opts().debug) {
    process.env.ZOHO_DEBUG = '1';
  }
});

// Add a note about the current limitations
program.addHelpText('after', `

${chalk.yellow('⚠️  Current Limitation:')}
  The Zoho Mail MCP integration via Pipedream has limited functionality.
  Only sending emails works via the MCP tools. Other operations require
  direct API access which is not yet implemented.

  To fully enable this CLI, we need either:
  1. Extended MCP tools from Pipedream (zoho_mail integration)
  2. Direct OAuth token extraction from pdauth
  3. IMAP/SMTP configuration (himalaya skill)

${chalk.gray('For updates: https://github.com/Versatly/zoho-mail-cli')}
`);

program.parse();
