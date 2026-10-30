const pad2 = (n: number) => String(n).padStart(2, '0');

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
