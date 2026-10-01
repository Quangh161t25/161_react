import { PasswordItem, PasswordVaultSettings, ExtensionSyncPayload } from '../types/password';

const PASSWORDS_STORAGE_KEY = 'erp_passwords_data';
const VAULT_SETTINGS_KEY = 'erp_password_vault_settings';
const LAST_SYNC_KEY = 'erp_passwords_last_sync';

// Simple hash for PIN comparison
export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'pin_' + Math.abs(hash).toString(16) + '_' + text.length;
}

// Calculate password strength score (0 to 100)
export function calculatePasswordScore(password: string): number {
  if (!password) return 0;
  let score = 0;

  // Length points
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 20;
  if (password.length >= 16) score += 15;

  // Character variety
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;

  return Math.min(100, Math.max(0, score));
}

// Password Generator helper
export interface PasswordGeneratorOptions {
  length: number;
  useUpper: boolean;
  useLower: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  excludeAmbiguous: boolean; // e.g. 0, O, l, 1, I
}

export function generateSecurePassword(options: PasswordGeneratorOptions): string {
  let chars = '';
  if (options.useLower) chars += options.excludeAmbiguous ? 'abcdefghijkmnpqrstuvwxyz' : 'abcdefghijklmnopqrstuvwxyz';
  if (options.useUpper) chars += options.excludeAmbiguous ? 'ABCDEFGHJKLMNPQRSTUVWXYZ' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (options.useNumbers) chars += options.excludeAmbiguous ? '23456789' : '0123456789';
  if (options.useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let result = '';
  const cryptoObj = typeof window !== 'undefined' && window.crypto ? window.crypto : null;

  if (cryptoObj && cryptoObj.getRandomValues) {
    const randomBuffer = new Uint32Array(options.length);
    cryptoObj.getRandomValues(randomBuffer);
    for (let i = 0; i < options.length; i++) {
      result += chars[randomBuffer[i] % chars.length];
    }
  } else {
    for (let i = 0; i < options.length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }

  return result;
}

export const passwordService = {
  getInitialPasswords(): PasswordItem[] {
    try {
      const stored = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Lọc bỏ các tài khoản mật khẩu mẫu cũ (id dạng pw_001 .. pw_006)
          return parsed.filter((p: PasswordItem) => !/^pw_00[1-6]$/.test(p.id));
        }
      }
    } catch (e) {
      console.error('Failed to parse cached passwords:', e);
    }
    return [];
  },

  getVaultSettings(): PasswordVaultSettings {
    try {
      const stored = localStorage.getItem(VAULT_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {
      isMasterPinEnabled: false,
      autoLockMinutes: 15,
    };
  },

  saveVaultSettings(settings: PasswordVaultSettings): void {
    try {
      localStorage.setItem(VAULT_SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save vault settings:', e);
    }
  },

  async fetchFromSheet(): Promise<PasswordItem[]> {
    try {
      const res = await fetch('/api/sheets/passwords');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        if (data.data.length > 0) {
          localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(data.data));
          localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
          return data.data;
        }
        // If sheet is empty but local storage has data, upload local data to Google Sheet
        const local = this.getInitialPasswords();
        if (local.length > 0) {
          await this.saveAllToSheet(local);
          return local;
        }
        return [];
      }
    } catch (e) {
      console.warn('Google Sheet fetch for Passwords failed, using fallback cache:', e);
    }
    return this.getInitialPasswords();
  },

  async saveAllToSheet(passwords: PasswordItem[]): Promise<boolean> {
    try {
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(passwords));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      const res = await fetch('/api/sheets/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwords }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Google Sheet save for Passwords failed, saved locally:', e);
      return true;
    }
  },

  async appendToSheet(password: PasswordItem): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Append password to sheet failed:', e);
      return false;
    }
  },

  async updateInSheet(password: PasswordItem): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Update password in sheet failed:', e);
      return false;
    }
  },

  async deleteFromSheet(idOrCode: string | string[]): Promise<boolean> {
    try {
      const codes = Array.isArray(idOrCode) ? idOrCode : [idOrCode];
      const res = await fetch('/api/sheets/delete-passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      return res.ok;
    } catch (e) {
      console.warn('Delete password from sheet failed:', e);
      return false;
    }
  },

  generateExtensionSyncPayload(): ExtensionSyncPayload {
    const items = this.getInitialPasswords();
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      vaultName: 'H161 ERP Password Vault',
      itemCount: items.length,
      items,
    };
  },

  importFromExtensionPayload(payload: ExtensionSyncPayload): PasswordItem[] {
    if (!payload || !Array.isArray(payload.items)) {
      throw new Error('Định dạng dữ liệu không hợp lệ!');
    }
    const current = this.getInitialPasswords();
    const currentMap = new Map(current.map((item) => [item.id, item]));

    payload.items.forEach((item) => {
      if (item && item.id) {
        currentMap.set(item.id, {
          ...item,
          securityScore: item.securityScore || calculatePasswordScore(item.password),
        });
      }
    });

    const merged = Array.from(currentMap.values());
    this.saveAllToSheet(merged);
    return merged;
  },
};
