import { taskService } from './taskService';
import { calendarService } from './calendarService';

export interface NotificationSettings {
  enabled: boolean;
  taskDueReminders: boolean;
  calendarReminders: boolean;
  dailyMorningReminder: boolean;
  morningTime: string; // 'HH:mm', default '08:30'
  sound: boolean;
}

const SETTINGS_KEY = 'erp_notification_settings';
const NOTIFIED_TRACKER_KEY = 'erp_notified_items_tracker';

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  taskDueReminders: true,
  calendarReminders: true,
  dailyMorningReminder: true,
  morningTime: '08:30',
  sound: true,
};

export const notificationService = {
  // Check if browser / phone supports notifications
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  // Check if Service Worker is supported
  isServiceWorkerSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  },

  // Get current permission status
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  // Request permission from user
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      alert('Trình duyệt hoặc thiết bị của bạn không hỗ trợ thông báo Web Notification.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const settings = this.getSettings();
        this.saveSettings({ ...settings, enabled: true });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Lỗi xin quyền thông báo:', err);
      return false;
    }
  },

  // Get saved user settings
  getSettings(): NotificationSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to parse notification settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  // Save user settings
  saveSettings(newSettings: Partial<NotificationSettings>): void {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save notification settings:', e);
    }
  },

  // Send an immediate notification to the device
  async sendNotification(
    title: string,
    options?: NotificationOptions & { url?: string; vibrate?: number[] | number }
  ): Promise<boolean> {
    if (!this.isSupported()) return false;

    // Check permission
    if (Notification.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    const targetUrl = options?.url || '/';

    const notificationPayload: any = {
      body: options?.body || '',
      icon: options?.icon || '/android-chrome-192x192.png',
      badge: options?.badge || '/favicon-32x32.png',
      vibrate: options?.vibrate || [100, 50, 100, 50, 100],
      data: { url: targetUrl, ...(options?.data || {}) },
      tag: options?.tag || `erp-${Date.now()}`,
      renotify: true,
      requireInteraction: false,
    };

    // Try sending via Service Worker first (Works even when app is minimized on phone)
    if (this.isServiceWorkerSupported()) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(title, notificationPayload);
          this.playNotificationSound();
          return true;
        }
      } catch (swErr) {
        console.warn('SW showNotification failed, trying fallback:', swErr);
      }
    }

    // Fallback to standard Notification API
    try {
      const notif = new Notification(title, notificationPayload);
      notif.onclick = () => {
        window.focus();
        if (targetUrl && window.location.pathname !== targetUrl) {
          window.location.href = targetUrl;
        }
        notif.close();
      };
      this.playNotificationSound();
      return true;
    } catch (fallbackErr) {
      console.warn('Standard notification failed:', fallbackErr);
      return false;
    }
  },

  // Optional subtle audio cue
  playNotificationSound(): void {
    const settings = this.getSettings();
    if (!settings.sound) return;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      // AudioContext may be restricted by browser policy before user interaction
    }
  },

  // Send a test notification to verify setup on phone
  async sendTestNotification(): Promise<boolean> {
    return this.sendNotification('🔔 ERP: Kết nối thông báo thành công!', {
      body: 'Thiết bị điện thoại của bạn đã sẵn sàng nhận thông báo công việc, lịch biểu và phê duyệt từ hệ thống ERP.',
      url: '/',
      tag: 'test-notification',
    });
  },

  // Automated checker for due tasks and calendar events
  checkAndNotifyDueItems(): void {
    const settings = this.getSettings();
    if (!settings.enabled || this.getPermission() !== 'granted') return;

    const todayStr = new Date().toISOString().slice(0, 10);
    let notifiedTracker: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(NOTIFIED_TRACKER_KEY);
      if (raw) notifiedTracker = JSON.parse(raw);
    } catch (e) {}

    // 1. Task Reminders
    if (settings.taskDueReminders) {
      try {
        const allTasks = taskService.getInitialTasks();
        const pendingTasks = allTasks.filter(
          (t) => t.status !== 'completed' && t.status !== 'cancelled'
        );

        // Tasks due today or overdue
        const dueTodayTasks = pendingTasks.filter((t) => t.dueDate === todayStr);
        const overdueTasks = pendingTasks.filter(
          (t) => t.dueDate && t.dueDate < todayStr
        );

        const trackerKeyDue = `task_due_${todayStr}`;
        if (dueTodayTasks.length > 0 && !notifiedTracker[trackerKeyDue]) {
          this.sendNotification(`📌 Có ${dueTodayTasks.length} công việc đến hạn hôm nay`, {
            body: dueTodayTasks.map((t) => `• ${t.title}`).slice(0, 3).join('\n') +
              (dueTodayTasks.length > 3 ? `\n... và ${dueTodayTasks.length - 3} việc khác` : ''),
            url: '/cong-viec/danh-sach',
            tag: trackerKeyDue,
          });
          notifiedTracker[trackerKeyDue] = true;
        }

        const trackerKeyOverdue = `task_overdue_${todayStr}`;
        if (overdueTasks.length > 0 && !notifiedTracker[trackerKeyOverdue]) {
          this.sendNotification(`⚠️ Cảnh báo: ${overdueTasks.length} công việc đang quá hạn!`, {
            body: `Cần xử lý gấp: ${overdueTasks[0]?.title}`,
            url: '/cong-viec/danh-sach',
            tag: trackerKeyOverdue,
          });
          notifiedTracker[trackerKeyOverdue] = true;
        }
      } catch (err) {
        console.warn('Error checking task reminders:', err);
      }
    }

    // 2. Calendar Event Reminders
    if (settings.calendarReminders) {
      try {
        const events = calendarService.aggregateAllEvents();
        const todayEvents = events.filter(
          (e) => e.startDate === todayStr || (e.startDate <= todayStr && (e.endDate ? e.endDate >= todayStr : false))
        );

        const trackerKeyEvent = `calendar_event_${todayStr}`;
        if (todayEvents.length > 0 && !notifiedTracker[trackerKeyEvent]) {
          this.sendNotification(`📅 Lịch biểu hôm nay: ${todayEvents.length} sự kiện`, {
            body: todayEvents.map((e) => `• ${e.time ? `${e.time} - ` : ''}${e.title}`).slice(0, 3).join('\n'),
            url: '/lich',
            tag: trackerKeyEvent,
          });
          notifiedTracker[trackerKeyEvent] = true;
        }
      } catch (err) {
        console.warn('Error checking calendar reminders:', err);
      }
    }

    try {
      localStorage.setItem(NOTIFIED_TRACKER_KEY, JSON.stringify(notifiedTracker));
    } catch (e) {}
  },
};
