import { Employee } from '../types/employee';
import { MOCK_EMPLOYEES } from '../data/employees';

const STORAGE_KEY = 'erp_employees_cache';
const LAST_SYNC_KEY = 'erp_employees_last_sync';

export const employeeService = {
  getInitialEmployees(): Employee[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read employees from cache:', e);
    }
    return MOCK_EMPLOYEES;
  },

  saveToCache(employees: Employee[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
      localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('Could not save employees to cache:', e);
    }
  },

  getLastSyncTime(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },

  async fetchFromSheet(): Promise<Employee[]> {
    try {
      const res = await fetch('/api/sheets/employees');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        this.saveToCache(data.data);
        return data.data;
      }
      throw new Error(data.error || 'Empty data returned');
    } catch (err) {
      console.warn('Failed to fetch employees from Google Sheet, fallback to cache:', err);
      return this.getInitialEmployees();
    }
  },

  // Append a single new employee row to Google Sheet
  async appendToSheet(employee: Employee): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to append employee to Google Sheet:', err);
      return false;
    }
  },

  // Update a single employee row directly in Google Sheet
  async updateInSheet(employee: Employee): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to update employee in Google Sheet:', err);
      return false;
    }
  },

  // Delete specific rows from Google Sheet by identifiers (code, username, or name)
  async deleteFromSheet(identifiers: string[] | string): Promise<boolean> {
    const codes = Array.isArray(identifiers) ? identifiers : [identifiers];
    if (codes.length === 0) return true;
    try {
      const res = await fetch('/api/sheets/delete-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to delete employees from Google Sheet:', err);
      return false;
    }
  },

  // Full 2-way sync / rewrite fallback
  async syncAllToSheet(employees: Employee[]): Promise<boolean> {
    this.saveToCache(employees);
    try {
      const res = await fetch('/api/sheets/save-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees }),
      });
      const data = await res.json();
      return !!data.success;
    } catch (err) {
      console.error('Failed to sync employees to Google Sheet:', err);
      return false;
    }
  },
};
