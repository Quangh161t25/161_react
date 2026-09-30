import { CashTransaction } from '../types/cashTransaction';

const STORAGE_KEY = 'erp_cash_transactions_cache';
const LAST_SYNC_KEY = 'erp_cash_transactions_last_sync';

export const cashTransactionService = {
  getInitialTransactions(): CashTransaction[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read cash transactions from cache:', e);
    }
    return [];
  },

  saveToCache(transactions: CashTransaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save cash transactions to cache:', e);
    }
  },

  saveToLocalCache(transactions: CashTransaction[]): void {
    this.saveToCache(transactions);
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  async fetchFromSheet(): Promise<CashTransaction[]> {
    try {
      const res = await fetch('/api/sheets/transactions');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch transactions from Google Sheet, fallback to cache:', err);
      return this.getInitialTransactions();
    }
  },

  async appendToSheet(transaction: CashTransaction): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append transaction to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(transactionOrId: CashTransaction | string, partial?: Partial<CashTransaction>): Promise<boolean> {
    try {
      const payload = typeof transactionOrId === 'string' ? { id: transactionOrId, ...partial } : transactionOrId;
      const res = await fetch('/api/sheets/update-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction: payload }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update transaction in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete transactions from Google Sheet:', err);
      return false;
    }
  },

  appendTransaction(transaction: CashTransaction) {
    return this.appendToSheet(transaction);
  },

  updateTransaction(transaction: CashTransaction) {
    return this.updateInSheet(transaction);
  },

  deleteTransactions(identifiers: string[] | string) {
    return this.deleteFromSheet(identifiers);
  },

  async saveAllToSheet(transactions: CashTransaction[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to save all transactions to Google Sheet:', err);
      return false;
    }
  },
};
