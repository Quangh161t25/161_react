import { Note } from '../types/note';
import { MOCK_NOTES } from '../data/notes';

const STORAGE_KEY = 'erp_notes_cache';
const LAST_SYNC_KEY = 'erp_notes_last_sync';

export const noteService = {
  getInitialNotes(): Note[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read notes from cache:', e);
    }
    return MOCK_NOTES;
  },

  saveToCache(notes: Note[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save notes to cache:', e);
    }
  },

  saveToLocalCache(notes: Note[]): void {
    this.saveToCache(notes);
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  async fetchFromSheet(): Promise<Note[]> {
    try {
      const res = await fetch('/api/sheets/notes');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch notes from Google Sheet, fallback to cache:', err);
      return this.getInitialNotes();
    }
  },

  async appendToSheet(note: Note): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append note to Google Sheet:', err);
      return false;
    }
  },

  async updateInSheet(noteOrId: Note | string, partial?: Partial<Note>): Promise<boolean> {
    try {
      const payload = typeof noteOrId === 'string' ? { id: noteOrId, ...partial } : noteOrId;
      const res = await fetch('/api/sheets/update-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: payload }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update note in Google Sheet:', err);
      return false;
    }
  },

  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete notes from Google Sheet:', err);
      return false;
    }
  },
};
