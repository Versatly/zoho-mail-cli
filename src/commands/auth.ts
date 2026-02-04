import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import {
  checkZohoConnection,
  generateConnectLink,
  disconnectZoho,
  getPdauthUserId,
} from '../lib/auth.js';
import { getConfig, setConfig, clearConfig, getConfigPath, isConfigured } from '../lib/config.js';
import { success, error, info, warn } from '../lib/output.js';

export function registerAuthCommands(program: Command): void {
  const auth = program
    .command('auth')
    .description('Manage Zoho Mail authentication');

  auth
    .command('login')
    .description('Authenticate with Zoho Mail via Pipedream OAuth')
    .option('--user <userId>', 'Pipedream user ID (default: telegram:5439689035)')
    .option('--region <region>', 'Zoho region (zoho.com, zoho.eu, zoho.in, zoho.com.au, zoho.jp)')
    .action(async (options) => {
      const spinner = ora('Checking existing connection...').start();

      // Set user ID if provided
      if (options.user) {
        setConfig({ userId: options.user });
      } else if (!getConfig().userId) {
        setConfig({ userId: 'telegram:5439689035' }); // Default
      }

      // Check if already connected
      const existing = checkZohoConnection();
      if (existing) {
        spinner.succeed('Already connected to Zoho Mail');
        console.log(`  ${chalk.gray('Account:')} ${existing.name}`);
        console.log(`  ${chalk.gray('User ID:')} ${getPdauthUserId()}`);
        
        // Set region if provided
        if (options.region) {
          setConfig({ region: options.region });
          info(`Region set to: ${options.region}`);
        }
        return;
      }

      spinner.text = 'Generating OAuth link...';
      const link = generateConnectLink();
      
      if (!link) {
        spinner.fail('Failed to generate OAuth link');
        error('Make sure pdauth is installed and configured');
        console.log(`  Run: ${chalk.cyan('npm install -g pdauth && pdauth config')}`);
        process.exit(1);
      }

      spinner.stop();
      console.log();
      console.log(chalk.bold('🔗 Click this link to authorize Zoho Mail:'));
      console.log();
      console.log(`  ${chalk.cyan(link)}`);
      console.log();
      console.log(chalk.gray('After authorizing, run `zoho-mail auth status` to verify.'));

      // Set region if provided
      if (options.region) {
        setConfig({ region: options.region });
      }
    });

  auth
    .command('status')
    .description('Check authentication status')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const connection = checkZohoConnection();
      const config = getConfig();

      if (options.json) {
        console.log(JSON.stringify({
          connected: !!connection,
          account: connection?.name || null,
          userId: config.userId,
          region: config.region,
          accountId: config.accountId,
          configPath: getConfigPath(),
        }, null, 2));
        return;
      }

      console.log();
      console.log(chalk.bold('Zoho Mail CLI Status'));
      console.log(chalk.gray('─'.repeat(40)));

      if (connection) {
        console.log(`${chalk.green('●')} Connected`);
        console.log(`  ${chalk.gray('Account:')} ${connection.name}`);
        console.log(`  ${chalk.gray('Healthy:')} ${connection.healthy ? chalk.green('Yes') : chalk.red('No')}`);
      } else {
        console.log(`${chalk.red('●')} Not connected`);
        console.log(`  Run ${chalk.cyan('zoho-mail auth login')} to connect`);
      }

      console.log();
      console.log(chalk.gray('Configuration:'));
      console.log(`  ${chalk.gray('User ID:')} ${config.userId || '(not set)'}`);
      console.log(`  ${chalk.gray('Region:')} ${config.region || 'zoho.com'}`);
      console.log(`  ${chalk.gray('Account ID:')} ${config.accountId || '(not set)'}`);
      console.log(`  ${chalk.gray('Config Path:')} ${getConfigPath()}`);
      console.log();
    });

  auth
    .command('logout')
    .description('Disconnect from Zoho Mail')
    .option('--force', 'Skip confirmation')
    .action(async (options) => {
      const connection = checkZohoConnection();
      
      if (!connection) {
        warn('Not currently connected to Zoho Mail');
        return;
      }

      if (!options.force) {
        console.log(`About to disconnect: ${chalk.cyan(connection.name)}`);
        console.log(chalk.yellow('This will remove your Zoho Mail connection from Pipedream.'));
        console.log();
        console.log('Run with --force to confirm.');
        return;
      }

      const spinner = ora('Disconnecting...').start();
      const result = disconnectZoho();
      
      if (result) {
        clearConfig();
        spinner.succeed('Disconnected from Zoho Mail');
      } else {
        spinner.fail('Failed to disconnect');
        error('Try running: pdauth disconnect zoho_mail --user ' + getPdauthUserId());
      }
    });

  auth
    .command('set-region')
    .description('Set Zoho region')
    .argument('<region>', 'Region (zoho.com, zoho.eu, zoho.in, zoho.com.au, zoho.jp)')
    .action((region) => {
      const validRegions = ['zoho.com', 'zoho.eu', 'zoho.in', 'zoho.com.au', 'zoho.jp'];
      if (!validRegions.includes(region)) {
        error(`Invalid region. Valid options: ${validRegions.join(', ')}`);
        process.exit(1);
      }
      setConfig({ region });
      success(`Region set to: ${region}`);
    });

  auth
    .command('set-account')
    .description('Set default account ID')
    .argument('<accountId>', 'Zoho account ID')
    .action((accountId) => {
      setConfig({ accountId });
      success(`Account ID set to: ${accountId}`);
    });
}
