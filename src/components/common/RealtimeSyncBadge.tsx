import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RealtimeSyncBadgeProps {
  isSyncing: boolean;
  lastSyncTime?: Date | null;
  onSync?: () => void;
  className?: string;
}

export const RealtimeSyncBadge: React.FC<RealtimeSyncBadgeProps> = ({
  isSyncing,
  lastSyncTime,
  onSync,
  className = '',
}) => {
  const timeFormatted = lastSyncTime
    ? lastSyncTime.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  const tooltipText = isSyncing
    ? 'Đang đồng bộ dữ liệu mới nhất từ Google Sheets...'
    : `Đang kết nối Realtime với Google Sheets. Tự động đồng bộ mỗi 25s hoặc ngay khi bạn click quay lại tab này.${
        timeFormatted ? ` Lần đồng bộ gần nhất: ${timeFormatted}` : ''
      }`;

  return (
    <button
      type="button"
      onClick={onSync}
      title={tooltipText}
      className={`h-8 px-2.5 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-all select-none ${
        isSyncing
          ? 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
      } ${className}`}
    >
      {/* Realtime Pulsing Dot Indicator */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isSyncing ? (
          <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600 dark:text-blue-400" />
        ) : (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </>
        )}
      </span>

      <span className="font-medium whitespace-nowrap">
        {isSyncing ? (
          'Đang đồng bộ...'
        ) : (
          <>
            <span className="hidden sm:inline">Google Sheet</span>
            <span className="sm:hidden">Sheets</span>
          </>
        )}
      </span>

      {/* Sync icon indicator */}
      {!isSyncing && (
        <RefreshCw className="w-3 h-3 text-emerald-600/70 dark:text-emerald-400/70 hover:rotate-180 transition-transform duration-300 shrink-0" />
      )}
    </button>
  );
};
