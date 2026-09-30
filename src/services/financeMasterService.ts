import {
  FinanceCategory,
  FinanceAccount,
  Counterparty,
  ApprovalThreshold,
} from '../types/financeMaster';

// --------------------------------------------------------------------
// 1. FINANCE CATEGORY SERVICE
// --------------------------------------------------------------------
const CATEGORY_STORAGE_KEY = 'erp_finance_categories_cache';
const CATEGORY_LAST_SYNC_KEY = 'erp_finance_categories_last_sync';

export const financeCategoryService = {
  getInitialCategories(): FinanceCategory[] {
    try {
      const cached = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read finance categories from cache:', e);
    }
    return [];
  },

  saveToCache(categories: FinanceCategory[]): void {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categories));
      localStorage.setItem(CATEGORY_LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save finance categories to cache:', e);
    }
  },

  async fetchFromSheet(): Promise<FinanceCategory[]> {
    try {
      const res = await fetch('/api/sheets/finance-categories');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch finance categories from Google Sheet, fallback to cache:', err);
      return this.getInitialCategories();
    }
  },

  async appendToSheet(category: FinanceCategory): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-finance-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append finance category to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(category: FinanceCategory): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-finance-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update finance category in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-finance-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete finance categories from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(categories: FinanceCategory[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-finance-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to save all finance categories to Google Sheet:', err);
      return false;
    }
  },
};

// --------------------------------------------------------------------
// 2. FINANCE ACCOUNT SERVICE
// --------------------------------------------------------------------
const ACCOUNT_STORAGE_KEY = 'erp_finance_accounts_cache';
const ACCOUNT_LAST_SYNC_KEY = 'erp_finance_accounts_last_sync';

export const financeAccountService = {
  getInitialAccounts(): FinanceAccount[] {
    try {
      const cached = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read finance accounts from cache:', e);
    }
    return [];
  },

  saveToCache(accounts: FinanceAccount[]): void {
    try {
      localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
      localStorage.setItem(ACCOUNT_LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save finance accounts to cache:', e);
    }
  },

  async fetchFromSheet(): Promise<FinanceAccount[]> {
    try {
      const res = await fetch('/api/sheets/finance-accounts');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch finance accounts from Google Sheet, fallback to cache:', err);
      return this.getInitialAccounts();
    }
  },

  async appendToSheet(account: FinanceAccount): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-finance-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append finance account to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(account: FinanceAccount): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-finance-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update finance account in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-finance-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete finance accounts from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(accounts: FinanceAccount[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-finance-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to save all finance accounts to Google Sheet:', err);
      return false;
    }
  },
};

// --------------------------------------------------------------------
// 3. COUNTERPARTY SERVICE
// --------------------------------------------------------------------
const COUNTERPARTY_STORAGE_KEY = 'erp_counterparties_cache';
const COUNTERPARTY_LAST_SYNC_KEY = 'erp_counterparties_last_sync';

export const counterpartyService = {
  getInitialCounterparties(): Counterparty[] {
    try {
      const cached = localStorage.getItem(COUNTERPARTY_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read counterparties from cache:', e);
    }
    return [];
  },

  saveToCache(counterparties: Counterparty[]): void {
    try {
      localStorage.setItem(COUNTERPARTY_STORAGE_KEY, JSON.stringify(counterparties));
      localStorage.setItem(COUNTERPARTY_LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save counterparties to cache:', e);
    }
  },

  async fetchFromSheet(): Promise<Counterparty[]> {
    try {
      const res = await fetch('/api/sheets/counterparties');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch counterparties from Google Sheet, fallback to cache:', err);
      return this.getInitialCounterparties();
    }
  },

  async appendToSheet(counterparty: Counterparty): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-counterparty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterparty }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append counterparty to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(counterparty: Counterparty): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-counterparty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterparty }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update counterparty in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-counterparties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete counterparties from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(counterparties: Counterparty[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-counterparties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterparties }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to save all counterparties to Google Sheet:', err);
      return false;
    }
  },
};

// --------------------------------------------------------------------
// 4. APPROVAL THRESHOLD SERVICE
// --------------------------------------------------------------------
const THRESHOLD_STORAGE_KEY = 'erp_approval_thresholds_cache';
const THRESHOLD_LAST_SYNC_KEY = 'erp_approval_thresholds_last_sync';

export const approvalThresholdService = {
  getInitialThresholds(): ApprovalThreshold[] {
    try {
      const cached = localStorage.getItem(THRESHOLD_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read approval thresholds from cache:', e);
    }
    return [];
  },

  saveToCache(thresholds: ApprovalThreshold[]): void {
    try {
      localStorage.setItem(THRESHOLD_STORAGE_KEY, JSON.stringify(thresholds));
      localStorage.setItem(THRESHOLD_LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save approval thresholds to cache:', e);
    }
  },

  async fetchFromSheet(): Promise<ApprovalThreshold[]> {
    try {
      const res = await fetch('/api/sheets/approval-thresholds');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch approval thresholds from Google Sheet, fallback to cache:', err);
      return this.getInitialThresholds();
    }
  },

  async appendToSheet(threshold: ApprovalThreshold): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-approval-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append approval threshold to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(threshold: ApprovalThreshold): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-approval-threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update approval threshold in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-approval-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete approval thresholds from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(thresholds: ApprovalThreshold[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-approval-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to save all approval thresholds to Google Sheet:', err);
      return false;
    }
  },
};
