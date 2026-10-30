interface SyncableItem {
  id: string;
  code?: string;
  title: string;
}

/**
 * Theo dõi các bản ghi đã lưu trên máy nhưng chưa ghi được lên Google Sheet,
 * để lần tải từ Sheet tiếp theo không ghi đè mất chúng và tự gửi lại.
 *
 * Chỉ lưu id: nội dung lấy từ cache nên giữ được chỉnh sửa mới nhất,
 * bản ghi đã bị xóa khỏi cache sẽ tự rơi khỏi danh sách chờ.
 * Sheet không lưu id nội bộ nên đối chiếu với dữ liệu Sheet bằng mã + tiêu đề.
 */
export function createPendingSync<T extends SyncableItem>(
  storageKey: string,
  getLocalItems: () => T[],
  retryAppend: (item: T) => Promise<boolean>
) {
  const inFlight = new Map<string, Promise<boolean>>();

  const readIds = (): string[] => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeIds = (ids: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(new Set(ids))));
    } catch (e) {
      console.warn('Could not save pending sync list:', e);
    }
  };

  return {
    async track(id: string, send: () => Promise<boolean>): Promise<boolean> {
      writeIds([...readIds(), id]);
      const request = send();
      inFlight.set(id, request);
      try {
        const ok = await request;
        if (ok) writeIds(readIds().filter((pendingId) => pendingId !== id));
        return ok;
      } finally {
        inFlight.delete(id);
      }
    },

    // Chờ mọi lệnh gửi lên Sheet đang chạy kết thúc
    async settled(): Promise<void> {
      await Promise.allSettled(Array.from(inFlight.values()));
    },

    // Gộp bản ghi chưa đồng bộ vào dữ liệu Sheet vừa tải về và gửi lại chúng
    mergeWithRemote(remoteItems: T[]): T[] {
      const ids = readIds();
      const localItems = getLocalItems();
      const unsynced = ids
        .map((id) => localItems.find((item) => item.id === id))
        .filter((item): item is T => !!item)
        .filter((item) => !remoteItems.some((r) => r.code === item.code && r.title === item.title));

      writeIds([...unsynced.map((item) => item.id), ...ids.filter((id) => inFlight.has(id))]);
      unsynced.filter((item) => !inFlight.has(item.id)).forEach((item) => void retryAppend(item));

      return [...unsynced, ...remoteItems];
    },
  };
}
