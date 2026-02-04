import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig } from '../lib/config.js';
import { checkZohoConnection } from '../lib/auth.js';
import { getLabels, createLabel, deleteLabel, getAccountId } from '../lib/client.js';
import { formatLabels, success, error, warn } from '../lib/output.js';

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
    console.log(`  Run ${chalk.cyan('zoho-mail auth set-account <accountId>')} to set it manually`);
    process.exit(1);
  }
}

export function registerLabelsCommands(program: Command): void {
  const labels = program
    .command('labels')
    .description('Manage email labels/tags');

  labels
    .command('list')
    .description('List all labels')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora('Fetching labels...').start();

      try {
        const labelList = await getLabels(accountId);
        spinner.stop();
        
        if (labelList.length === 0) {
          console.log(chalk.gray('No labels found'));
        } else {
          console.log(formatLabels(labelList, options.json));
        }
      } catch (err) {
        spinner.fail('Failed to fetch labels');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  labels
    .command('create')
    .description('Create a new label')
    .argument('<name>', 'Label name')
    .option('--color <hex>', 'Label color (hex code, e.g., #ff0000)')
    .option('--json', 'Output as JSON')
    .action(async (name, options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      const spinner = ora(`Creating label "${name}"...`).start();

      try {
        const label = await createLabel(accountId, name, options.color);
        spinner.succeed(`Created label: ${label.labelName}`);

        if (options.json) {
          console.log(JSON.stringify(label, null, 2));
        } else {
          console.log(`  ${chalk.gray('Label ID:')} ${label.labelId}`);
          if (label.color) {
            console.log(`  ${chalk.gray('Color:')} ${label.color}`);
          }
        }
      } catch (err) {
        spinner.fail('Failed to create label');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });

  labels
    .command('update')
    .description('Update a label')
    .argument('<labelId>', 'Label ID')
    .option('--name <name>', 'New label name')
    .option('--color <hex>', 'New label color')
    .action(async (labelId, options) => {
      requireAuth();
      await ensureAccountId();

      if (!options.name && !options.color) {
        error('Provide at least --name or --color to update');
        process.exit(1);
      }

      error('Label updating not yet implemented');
      process.exit(1);
    });

  labels
    .command('delete')
    .description('Delete a label')
    .argument('<labelId>', 'Label ID to delete')
    .option('--force', 'Skip confirmation')
    .action(async (labelId, options) => {
      requireAuth();
      const accountId = await ensureAccountId();

      if (!options.force) {
        warn(`About to delete label: ${labelId}`);
        console.log(chalk.yellow('This will remove the label from all emails.'));
        console.log();
        console.log('Run with --force to confirm.');
        return;
      }

      const spinner = ora('Deleting label...').start();

      try {
        await deleteLabel(accountId, labelId);
        spinner.succeed('Label deleted');
      } catch (err) {
        spinner.fail('Failed to delete label');
        const message = err instanceof Error ? err.message : String(err);
        error(message);
        process.exit(1);
      }
    });
}
