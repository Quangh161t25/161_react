const pad2 = (n: number) => String(n).padStart(2, '0');

export interface DateParts {
  day: string;
  month: string;
  year: string;
  hours?: string;
  minutes?: string;
  seconds?: string;
}

/**
 * Phân tích chuỗi hoặc đối tượng ngày thành các thành phần: ngày, tháng, năm, giờ, phút.
 * Hỗ trợ các định dạng phổ biến:
 * - DD/MM/YYYY hoặc DD/MM/YYYY HH:mm
 * - DD-MM-YYYY hoặc DD-MM-YYYY HH:mm
 * - YYYY-MM-DD hoặc YYYY-MM-DD HH:mm (ISO 8601)
 * - Đối tượng Date hoặc timestamp
 */
export function parseDateParts(input?: Date | string | number | null): DateParts | null {
  if (!input) return null;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // 1. DD/MM/YYYY [HH:mm[:ss]]
    const ddmmyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (ddmmyyyy) {
      return {
        day: ddmmyyyy[1].padStart(2, '0'),
        month: ddmmyyyy[2].padStart(2, '0'),
        year: ddmmyyyy[3],
        hours: ddmmyyyy[4] ? ddmmyyyy[4].padStart(2, '0') : undefined,
        minutes: ddmmyyyy[5] ? ddmmyyyy[5].padStart(2, '0') : undefined,
        seconds: ddmmyyyy[6] ? ddmmyyyy[6].padStart(2, '0') : undefined,
      };
    }

    // 2. DD-MM-YYYY [HH:mm[:ss]]
    const ddmmyyyyDash = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (ddmmyyyyDash) {
      return {
        day: ddmmyyyyDash[1].padStart(2, '0'),
        month: ddmmyyyyDash[2].padStart(2, '0'),
        year: ddmmyyyyDash[3],
        hours: ddmmyyyyDash[4] ? ddmmyyyyDash[4].padStart(2, '0') : undefined,
        minutes: ddmmyyyyDash[5] ? ddmmyyyyDash[5].padStart(2, '0') : undefined,
        seconds: ddmmyyyyDash[6] ? ddmmyyyyDash[6].padStart(2, '0') : undefined,
      };
    }

    // 3. YYYY-MM-DD [HH:mm[:ss]] or YYYY/MM/DD
    const yyyymmdd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[\sT](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (yyyymmdd) {
      return {
        day: yyyymmdd[3].padStart(2, '0'),
        month: yyyymmdd[2].padStart(2, '0'),
        year: yyyymmdd[1],
        hours: yyyymmdd[4] ? yyyymmdd[4].padStart(2, '0') : undefined,
        minutes: yyyymmdd[5] ? yyyymmdd[5].padStart(2, '0') : undefined,
        seconds: yyyymmdd[6] ? yyyymmdd[6].padStart(2, '0') : undefined,
      };
    }
  }

  const d = input instanceof Date ? input : new Date(input as any);
  if (isNaN(d.getTime())) return null;
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year: String(d.getFullYear()),
    hours: String(d.getHours()).padStart(2, '0'),
    minutes: String(d.getMinutes()).padStart(2, '0'),
    seconds: String(d.getSeconds()).padStart(2, '0'),
  };
}

/**
 * Định dạng ngày theo chuẩn Việt Nam DD/MM/YYYY.
 * Không bị ảnh hưởng bởi timezone drift khi truyền chuỗi YYYY-MM-DD.
 */
export function formatDate(input?: Date | string | number | null): string {
  const parts = parseDateParts(input);
  if (!parts) return typeof input === 'string' ? input : '';
  return `${parts.day}/${parts.month}/${parts.year}`;
}

/**
 * Định dạng ngày giờ DD/MM/YYYY HH:mm (nếu không có giờ sẽ chỉ trả về DD/MM/YYYY).
 */
export function formatDateTime(input?: Date | string | number | null): string {
  const parts = parseDateParts(input);
  if (!parts) return typeof input === 'string' ? input : '';
  const dateStr = `${parts.day}/${parts.month}/${parts.year}`;
  if (parts.hours !== undefined && parts.minutes !== undefined) {
    return `${dateStr} ${parts.hours}:${parts.minutes}`;
  }
  return dateStr;
}

/**
 * Chuyển đổi ngày bất kỳ sang định dạng YYYY-MM-DD dành cho <input type="date">.
 */
export function toInputDateValue(input?: Date | string | number | null): string {
  const parts = parseDateParts(input);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/**
 * Alias cho formatDate để tương thích ngược.
 */
export const toDisplayDate = formatDate;

/**
 * Ngày theo giờ máy người dùng, dạng YYYY-MM-DD.
 * Không dùng toISOString() vì nó tính theo UTC: ở Việt Nam, trước 7h sáng sẽ ra ngày hôm trước.
 */
export function toLocalDateStr(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** Giờ theo giờ máy người dùng, dạng HH:mm */
export function toLocalTimeStr(date: Date = new Date()): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}
