export type GroupDirection = 'asc' | 'desc';

export interface RowGroupValue {
  key: string; // Giá trị dùng để gộp nhóm và sắp xếp
  label: string; // Giá trị hiển thị trên tiêu đề nhóm
}

export interface RowGroupInfo {
  key: string;
  label: string;
  count: number;
}

export const EMPTY_GROUP_LABEL = '(Trống)';

const collator = new Intl.Collator('vi', { numeric: true, sensitivity: 'base' });

export const compareText = (a: string, b: string, direction: GroupDirection): number =>
  direction === 'asc' ? collator.compare(a, b) : collator.compare(b, a);

// Không phân biệt hoa thường và khoảng trắng thừa khi gộp nhóm
export const normalizeGroupKey = (key: string): string => key.trim().toLowerCase();

// Xếp các dòng cùng nhóm liền nhau, giữ nguyên thứ tự sẵn có trong từng nhóm. Nhóm trống luôn ở cuối.
export function sortRowsIntoGroups<T>(
  rows: T[],
  getValue: (row: T) => RowGroupValue,
  direction: GroupDirection
): { rows: T[]; groups: Map<string, RowGroupInfo>; getGroupKey: (row: T) => string } {
  const buckets = new Map<string, { info: RowGroupInfo; sortKey: string; items: T[] }>();

  rows.forEach((row) => {
    const value = getValue(row);
    const key = normalizeGroupKey(value.key);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.items.push(row);
      bucket.info.count += 1;
    } else {
      buckets.set(key, {
        info: { key, label: value.label.trim() || EMPTY_GROUP_LABEL, count: 1 },
        sortKey: value.key.trim(),
        items: [row],
      });
    }
  });

  const ordered = Array.from(buckets.values()).sort((a, b) => {
    if (!a.info.key) return 1;
    if (!b.info.key) return -1;
    return compareText(a.sortKey, b.sortKey, direction);
  });

  return {
    rows: ordered.flatMap((bucket) => bucket.items),
    groups: new Map(ordered.map((bucket) => [bucket.info.key, bucket.info])),
    getGroupKey: (row) => normalizeGroupKey(getValue(row).key),
  };
}
