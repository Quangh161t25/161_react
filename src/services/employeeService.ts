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
