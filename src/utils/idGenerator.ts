/**
 * Utility sinh ID chuẩn hóa cho toàn bộ các module trong hệ thống ERP
 * Định dạng: mã modul + [code] + random 8 ký tự (ví dụ: note_a8f9x2k1, task_cv_001_f7b1c4e9)
 * Luôn đảm bảo toàn bộ id ở mọi modul kết thúc bằng 8 ký tự ngẫu nhiên.
 */

export function generateRandom8(seed?: string): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';

  // Nếu có seed, sinh 8 ký tự giả ngẫu nhiên có tính xác định (đảm bảo id ổn định cho dữ liệu sheet cũ)
  if (seed) {
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    const str = String(seed);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const combined = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    return (combined + 'k7x9m2p4').substring(0, 8);
  }

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
  | 'li'
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
  | 'link'
  | 'img'
  | string;

/**
 * Sinh ID mới có đuôi 8 ký tự ngẫu nhiên
 * @param prefix Tiền tố modul (note, task, prop, tx, emp, ...)
 * @param code Mã nghiệp vụ nếu có (VD: CV-001, DX-01, ...)
 */
export function generateId(prefix: ModuleIdPrefix, code?: string): string {
  const cleanPrefix = (prefix || 'item').replace(/[_-]+$/, '');
  const r8 = generateRandom8();
  if (code && String(code).trim()) {
    const cleanCode = String(code).trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    if (cleanCode) {
      return `${cleanPrefix}_${cleanCode}_${r8}`;
    }
  }
  return `${cleanPrefix}_${r8}`;
}

/**
 * Kiểm tra xem ID đã có đuôi 8 ký tự ngẫu nhiên hay chưa
 */
export function hasRandom8(id?: string | null): boolean {
  if (!id || typeof id !== 'string') return false;
  return /_[a-z0-9]{8}$/i.test(id.trim());
}

/**
 * Đảm bảo ID luôn có đuôi 8 ký tự ngẫu nhiên.
 * Nếu ID đã có _[8 ký tự ngẫu nhiên] thì giữ nguyên.
 * Nếu chưa có (hoặc chỉ là số thứ tự 1, 2, ...), gắn thêm 8 ký tự ngẫu nhiên vào đuôi.
 */
export function ensureIdHasRandom8(id?: string | null, prefix?: ModuleIdPrefix, code?: string): string {
  if (id && typeof id === 'string' && id.trim()) {
    const trimmed = id.trim();
    if (hasRandom8(trimmed)) {
      return trimmed;
    }
    // Nếu ID chỉ là số thứ tự (như row index 1, 2)
    if (/^\d+$/.test(trimmed)) {
      return generateId(prefix || 'item', code);
    }
    const cleanId = trimmed.replace(/[_-]+$/, '');
    return `${cleanId}_${generateRandom8()}`;
  }
  return generateId(prefix || 'item', code);
}
