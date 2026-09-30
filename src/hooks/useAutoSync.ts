import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseAutoSyncOptions<T> {
  /**
   * Async function to fetch latest data from Google Sheets API
   */
  syncFn: () => Promise<T>;
  /**
   * Callback invoked when fresh or updated data is received
   */
  onDataReceived: (data: T) => void;
  /**
   * Polling interval in milliseconds when tab is active (default: 25000 = 25 seconds)
   */
  intervalMs?: number;
  /**
   * Whether auto sync is enabled (default: true)
   */
  enabled?: boolean;
  /**
   * Minimum throttle time between consecutive fetches in milliseconds (default: 5000 = 5s)
   */
  minIntervalMs?: number;
  /**
   * Optional custom comparison function to detect if data actually changed
   */
  hasChanged?: (prev: T | null, next: T) => boolean;
}

export interface UseAutoSyncReturn {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  triggerManualSync: () => Promise<void>;
  isRealtimeActive: boolean;
}

/**
 * Custom hook for smart real-time auto-synchronization with Google Sheets:
 * 1. Background polling every 20-30 seconds when tab is visible
 * 2. Instant sync when user clicks / switches back into the browser tab (Window Focus & VisibilityChange)
 * 3. Throttled to prevent spamming Google Sheets API
 * 4. Only triggers UI updates when data actually changed
 */
export function useAutoSync<T>({
  syncFn,
  onDataReceived,
  intervalMs = 25000,
  enabled = true,
  minIntervalMs = 5000,
  hasChanged,
}: UseAutoSyncOptions<T>): UseAutoSyncReturn {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Store latest refs to avoid re-subscribing listeners unnecessarily
  const syncFnRef = useRef(syncFn);
  const onDataReceivedRef = useRef(onDataReceived);
  const hasChangedRef = useRef(hasChanged);
  const lastDataRef = useRef<T | null>(null);
  const lastSyncTimestampRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    syncFnRef.current = syncFn;
    onDataReceivedRef.current = onDataReceived;
    hasChangedRef.current = hasChanged;
  });

  // Default smart comparator (checks length or JSON structure)
  const defaultHasChanged = useCallback((prev: T | null, next: T): boolean => {
    if (prev === null) return true;
    if (Array.isArray(prev) && Array.isArray(next)) {
      if (prev.length !== next.length) return true;
      if (prev.length === 0 && next.length === 0) return false;
      // Fast check: compare first and last items or stringified payload
      return JSON.stringify(prev) !== JSON.stringify(next);
    }
    return JSON.stringify(prev) !== JSON.stringify(next);
  }, []);

  // Perform sync execution
  const executeSync = useCallback(
    async (isManual: boolean = false) => {
      const now = Date.now();
      // Throttle background syncs to avoid excessive requests
      if (!isManual && now - lastSyncTimestampRef.current < minIntervalMs) {
        return;
      }
      if (isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
        const freshData = await syncFnRef.current();
        lastSyncTimestampRef.current = Date.now();
        setLastSyncTime(new Date());

        const compare = hasChangedRef.current || defaultHasChanged;
        if (isManual || compare(lastDataRef.current, freshData)) {
          lastDataRef.current = freshData;
          onDataReceivedRef.current(freshData);
        }
      } catch (err) {
        console.warn('AutoSync background refresh notice:', err);
      } finally {
        isSyncingRef.current = false;
        setIsSyncing(false);
      }
    },
    [minIntervalMs, defaultHasChanged]
  );

  // 1. Initial sync and periodic polling when tab is active
  useEffect(() => {
    if (!enabled) return;

    // Run initial sync
    executeSync(false);

    // Set interval timer for background polling
    const timer = setInterval(() => {
      // Only poll if document is visible (saves network & CPU when tab is in background)
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        executeSync(false);
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [enabled, intervalMs, executeSync]);

  // 2. Instant sync when user switches back to the tab (Window Focus & Visibility Change)
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
        // User just clicked back into the tab: immediately refresh!
        executeSync(false);
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [enabled, executeSync]);

  const triggerManualSync = useCallback(async () => {
    await executeSync(true);
  }, [executeSync]);

  return {
    isSyncing,
    lastSyncTime,
    triggerManualSync,
    isRealtimeActive: enabled,
  };
}
