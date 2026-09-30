import { LearningEntry } from '../types/learning';

const STORAGE_KEY = 'erp_learning_cache';
const LAST_SYNC_KEY = 'erp_learning_last_sync';

export const learningService = {
  getInitialEntries(): LearningEntry[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read learning entries from cache:', e);
    }
    return [];
  },

  saveToCache(entries: LearningEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save learning entries to cache:', e);
    }
  },

  saveToLocalCache(entries: LearningEntry[]): void {
    this.saveToCache(entries);
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  async fetchFromSheet(): Promise<LearningEntry[]> {
    try {
      const res = await fetch('/api/sheets/learning');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        this.saveToCache(data.data);
        return data.data;
      }
      return this.getInitialEntries();
    } catch (err) {
      console.warn('Failed to fetch learning entries from Google Sheet, fallback to cache:', err);
      return this.getInitialEntries();
    }
  },

  async appendToSheet(entry: LearningEntry): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append learning entry to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(entryOrId: LearningEntry | string, partial?: Partial<LearningEntry>): Promise<boolean> {
    try {
      const payload = typeof entryOrId === 'string' ? { id: entryOrId, ...partial } : entryOrId;
      const res = await fetch('/api/sheets/update-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: payload }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update learning entry in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete learning entries from Google Sheet:', err);
      return false;
    }
  },

  async saveAllToSheet(entries: LearningEntry[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to save all learning entries to Google Sheet:', err);
      return false;
    }
  },
};
