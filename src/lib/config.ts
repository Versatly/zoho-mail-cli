import Conf from 'conf';
import type { ZohoConfig } from '../types/zoho.js';

const config = new Conf<ZohoConfig>({
  projectName: 'zoho-mail-cli',
  defaults: {
    region: 'zoho.com',
    accountId: '',
    userId: '',
    defaultFolder: 'Inbox',
  },
});

export function getConfig(): ZohoConfig {
  return {
    region: config.get('region'),
    accountId: config.get('accountId'),
    userId: config.get('userId'),
    defaultFolder: config.get('defaultFolder'),
  };
}

export function setConfig(updates: Partial<ZohoConfig>): void {
  if (updates.region !== undefined) config.set('region', updates.region);
  if (updates.accountId !== undefined) config.set('accountId', updates.accountId);
  if (updates.userId !== undefined) config.set('userId', updates.userId);
  if (updates.defaultFolder !== undefined) config.set('defaultFolder', updates.defaultFolder);
}

export function clearConfig(): void {
  config.clear();
}

export function isConfigured(): boolean {
  const cfg = getConfig();
  return !!(cfg.accountId && cfg.userId);
}

export function getConfigPath(): string {
  return config.path;
}
