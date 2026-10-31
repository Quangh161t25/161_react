import React, { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { Trigger } from '../../types/trigger';
import { notificationService } from '../../services/notificationService';
import { TRIGGER_FIRED_EVENT } from '../../services/triggerService';

// Thông báo trong web: giữ nguyên trên màn hình tới khi người dùng tắt
export const TriggerToastHost: React.FC = () => {
  const [fired, setFired] = useState<Trigger[]>([]);

  useEffect(() => {
    const handleFired = (e: Event) => {
      const trigger = (e as CustomEvent<Trigger>).detail;
      setFired((prev) => [...prev, trigger]);
      notificationService.playNotificationSound();
    };
    window.addEventListener(TRIGGER_FIRED_EVENT, handleFired);
    return () => window.removeEventListener(TRIGGER_FIRED_EVENT, handleFired);
  }, []);

  if (fired.length === 0) return null;

  return (
    <div className="fixed top-3 right-3 left-3 sm:left-auto sm:w-96 z-[60] space-y-2" role="status" aria-live="polite">
      {fired.map((trigger) => (
        <div key={trigger.id} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card shadow-2xl">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground break-words">{trigger.title}</p>
            {trigger.content && (
              <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap break-words">{trigger.content}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFired((prev) => prev.filter((t) => t.id !== trigger.id))}
            aria-label="Đóng thông báo"
            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
