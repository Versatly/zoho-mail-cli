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

// Add help text
program.addHelpText('after', `

${chalk.cyan('Examples:')}
  zoho-mail mail list              List inbox emails
  zoho-mail mail list --unread     List unread emails
  zoho-mail mail search "invoice"  Search for emails
  zoho-mail folders list           List all folders
  zoho-mail labels list            List all labels

${chalk.gray('For more info: https://github.com/Versatly/zoho-mail-cli')}
`);

program.parse();
