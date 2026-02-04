import { execSync } from 'child_process';
import { getConfig } from './config.js';

interface PdauthStatus {
  user: string;
  accounts: PdauthAccount[];
}

interface PdauthAccount {
  id: string;
  name: string;
  externalId: string;
  healthy: boolean;
  app: {
    id: string;
    nameSlug: string;
    name: string;
    customFieldsJson?: string;
  };
}

export function getPdauthUserId(): string {
  const config = getConfig();
  return config.userId || 'default';
}

export function checkZohoConnection(): PdauthAccount | null {
  const userId = getPdauthUserId();
  try {
    const result = execSync(`pdauth status --user ${userId} --json 2>&1`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    // Find the JSON block (skip the "- Fetching..." line and other output)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    
    const status: PdauthStatus = JSON.parse(jsonMatch[0]);
    const zohoAccount = status.accounts.find(a => a.app.nameSlug === 'zoho_mail');
    return zohoAccount || null;
  } catch (error) {
    // If --json doesn't work, try parsing non-JSON output
    try {
      const result = execSync(`pdauth status --user ${userId} 2>&1`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      
      // Check if zoho_mail appears in the output
      if (result.includes('zoho_mail') && result.includes('healthy')) {
        // Create a minimal account object
        const nameMatch = result.match(/Account ID: (apn_\w+)/);
        return {
          id: nameMatch?.[1] || 'unknown',
          name: 'zoho_mail',
          externalId: userId,
          healthy: true,
          app: {
            id: 'oa_zoho',
            nameSlug: 'zoho_mail',
            name: 'Zoho Mail',
          },
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}

export function getZohoRegion(): string {
  const account = checkZohoConnection();
  if (!account?.app.customFieldsJson) {
    return 'zoho.com'; // Default to US
  }
  
  try {
    // Parse custom fields to get region
    const customFields = JSON.parse(account.app.customFieldsJson);
    const regionField = customFields.find((f: { name: string }) => f.name === 'base_api_uri');
    // The user-selected value would be in the account data, not field definition
    // For now, default to US region
    return 'zoho.com';
  } catch {
    return 'zoho.com';
  }
}

export function generateConnectLink(): string | null {
  const userId = getPdauthUserId();
  try {
    const result = execSync(`pdauth connect zoho_mail --user ${userId}`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    // Extract URL from output
    const urlMatch = result.match(/(https:\/\/[^\s]+)/);
    return urlMatch ? urlMatch[1] : null;
  } catch (error) {
    return null;
  }
}

export function disconnectZoho(): boolean {
  const userId = getPdauthUserId();
  try {
    execSync(`pdauth disconnect zoho_mail --user ${userId} --force`, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return true;
  } catch (error) {
    return false;
  }
}
