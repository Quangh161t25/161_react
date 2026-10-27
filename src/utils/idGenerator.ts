/**
 * Utility sinh ID chuẩn hóa cho toàn bộ các module trong hệ thống ERP
 * Định dạng: mã modul + random 8 ký tự (ví dụ: note_a8f9x2k1, task_f7b1c4e9)
 */

export function generateRandom8(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(8);
    window.crypto.getRandomValues(bytes);
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(bytes[i] % chars.length);
    }
    return result;
  }
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export type ModuleIdPrefix =
  | 'note'
  | 'task'
  | 'st'
  | 'subtask'
  | 'cal'
  | 'custom'
  | 'learn'
  | 'tx'
  | 'prop'
  | 'cp'
  | 'pw'
  | 'emp'
  | 'proj'
  | 'wf'
  | 'acc'
  | 'cat'
  | 'thr'
  | 'ba'
  | 'cm'
  | 'att'
  | string;

export function generateId(prefix: ModuleIdPrefix): string {
  const cleanPrefix = prefix.replace(/[_-]+$/, '');
  return `${cleanPrefix}_${generateRandom8()}`;
}
