import { CostProposal } from '../types/cost-proposal';
import { MOCK_COST_PROPOSALS } from '../data/cost-proposals';

const STORAGE_KEY = 'erp_cost_proposals_cache';
const LAST_SYNC_KEY = 'erp_cost_proposals_last_sync';

export const googleSheetsService = {
  // Load cached proposals from localStorage if available, otherwise MOCK
  getInitialProposals(): CostProposal[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read proposals from localStorage cache:', e);
    }
    return MOCK_COST_PROPOSALS;
  },

  // Save list to local cache
  saveToCache(proposals: CostProposal[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save proposals to localStorage cache:', e);
    }
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  // Fetch live from Google Sheets via backend API
  async fetchFromSheet(): Promise<CostProposal[]> {
    try {
      const res = await fetch('/api/sheets/proposals');
      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch proposals from Google Sheet API, using local cache:', err);
      return this.getInitialProposals();
    }
  },

  // Append a single proposal to Google Sheet
  async appendToSheet(proposal: CostProposal): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append proposal to Google Sheet:', err);
      return false;
    }
  },

  // Sync entire proposals list to Google Sheet
  async syncAllToSheet(proposals: CostProposal[]): Promise<boolean> {
    this.saveToCache(proposals);
    try {
      const res = await fetch('/api/sheets/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposals }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to sync proposals to Google Sheet:', err);
      return false;
    }
  },

  // Check connection status
  async checkConnection(): Promise<{ connected: boolean; sheetTitle?: string }> {
    try {
      const res = await fetch('/api/sheets/status');
      if (!res.ok) return { connected: false };
      const data = await res.json();
      return {
        connected: data.status === 'connected',
        sheetTitle: data.sheetTitle,
      };
    } catch {
      return { connected: false };
    }
  },
};
