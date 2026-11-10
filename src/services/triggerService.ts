import { Note } from '../types/note';
import { Trigger } from '../types/trigger';
import { generateId } from '../utils/idGenerator';
import { toLocalDateStr, toLocalTimeStr, formatDate } from '../utils/dateUtils';
import { noteService } from './noteService';
import { notificationService } from './notificationService';

const STORAGE_KEY = 'erp_triggers';
const CHECK_INTERVAL_MS = 15000;

export const TRIGGERS_CHANGED_EVENT = 'erp:triggers-changed';
export const TRIGGER_FIRED_EVENT = 'erp:trigger-fired';
export const NOTES_CHANGED_EVENT = 'erp:notes-changed';

const nextNoteCode = (notes: Note[]): string => {
  const maxNum = notes.reduce((max, n) => {
    const m = (n.code || '').match(/NOTE-(\d+)/i);
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);
  return `NOTE-${String(maxNum + 1).padStart(3, '0')}`;
};

const addNoteFromTrigger = async (trigger: Trigger): Promise<string> => {
  // Lấy danh sách mới nhất để mã ghi chú không trùng với dòng đã có trên Sheet
  const notes = await noteService.fetchFromSheet();
  const [noteDate, noteTime] = trigger.runAt.split('T');
  const now = new Date().toISOString();
  const note: Note = {
    id: generateId('note'),
    code: nextNoteCode(notes),
    title: trigger.title,
    content: trigger.content || trigger.title,
    category: 'Nhật ký & Hoạt động',
    status: 'published',
    isPinned: false,
    color: 'blue',
    noteDate: formatDate(noteDate),
    noteTime: noteTime || '09:00',
    tags: ['Trigger', ...(trigger.tags || [])],
    author: trigger.createdBy || 'Trigger tự động',
    createdAt: now,
    updatedAt: now,
  };
  noteService.saveToLocalCache([note, ...noteService.getInitialNotes()]);
  window.dispatchEvent(new Event(NOTES_CHANGED_EVENT));

  const synced = await noteService.appendToSheet(note);
  return synced
    ? `Đã thêm ghi chú ${note.code} vào Sheet`
    : `Đã lưu ghi chú ${note.code} trên máy, sẽ tự gửi lên Sheet khi đồng bộ`;
};

const notifyFromTrigger = async (trigger: Trigger): Promise<string> => {
  window.dispatchEvent(new CustomEvent<Trigger>(TRIGGER_FIRED_EVENT, { detail: trigger }));
  if (notificationService.getPermission() !== 'granted') {
    return 'Chỉ hiện trong web vì chưa cấp quyền thông báo';
  }
  const sent = await notificationService.sendNotification(`⏰ ${trigger.title}`, {
    body: trigger.content,
    url: '/trigger',
    tag: trigger.id,
  });
  return sent ? 'Đã gửi thông báo tới thiết bị' : 'Chỉ hiện trong web vì thiết bị không nhận thông báo';
};

// Tính thời điểm lần chạy kế tiếp nếu có cấu hình lặp lại
const calculateNextRunAt = (currentRunAt: string, repeat?: string): string | null => {
  if (!repeat || repeat === 'none') return null;
  const d = new Date(currentRunAt);
  if (isNaN(d.getTime())) return null;

  if (repeat === 'daily') {
    d.setDate(d.getDate() + 1);
  } else if (repeat === 'weekly') {
    d.setDate(d.getDate() + 7);
  } else if (repeat === 'monthly') {
    d.setMonth(d.getMonth() + 1);
  } else {
    return null;
  }

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

// Trên nhiều tab, chỉ một tab được chạy tại một thời điểm để trigger không chạy trùng
const withExclusiveLock = async (run: () => Promise<void>): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request('erp_triggers_lock', run);
  } else {
    await run();
  }
};

export const triggerService = {
  // Lấy dữ liệu từ bộ nhớ đệm LocalStorage
  getAll(): Trigger[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not read triggers:', e);
      return [];
    }
  },

  // Lưu toàn bộ vào LocalStorage và phát event cập nhật UI
  saveAll(triggers: Trigger[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(triggers));
    } catch (e) {
      console.warn('Could not save triggers:', e);
    }
    window.dispatchEvent(new Event(TRIGGERS_CHANGED_EVENT));
  },

  // Thêm mới hoặc cập nhật 1 trigger trong cache
  upsert(trigger: Trigger): void {
    const others = this.getAll().filter((t) => t.id !== trigger.id && t.code !== trigger.code);
    this.saveAll([trigger, ...others]);
  },

  // Xóa trigger theo ID trong cache
  remove(id: string): void {
    this.saveAll(this.getAll().filter((t) => t.id !== id));
  },

  // Xóa nhiều trigger theo danh sách IDs trong cache
  removeMany(ids: string[]): void {
    const set = new Set(ids);
    this.saveAll(this.getAll().filter((t) => !set.has(t.id)));
  },

  // ==========================================
  // GOOGLE SHEETS API INTEGRATION
  // ==========================================

  // Tải danh sách triggers từ Google Sheet
  async fetchFromSheet(): Promise<Trigger[]> {
    try {
      const res = await fetch('/api/sheets/triggers');
      if (!res.ok) {
        throw new Error(`Fetch triggers failed: ${await res.text()}`);
      }
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        const triggers: Trigger[] = json.data;
        this.saveAll(triggers);
        return triggers;
      }
    } catch (err) {
      console.warn('Error fetching triggers from Google Sheet, falling back to cache:', err);
    }
    return this.getAll();
  },

  // Thêm 1 trigger vào Google Sheet
  async appendToSheet(trigger: Trigger): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/append-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Error appending trigger to Google Sheet:', err);
      return false;
    }
  },

  // Cập nhật 1 trigger trên Google Sheet
  async updateInSheet(trigger: Trigger): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/update-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Error updating trigger in Google Sheet:', err);
      return false;
    }
  },

  // Xóa 1 hoặc nhiều trigger khỏi Google Sheet
  async deleteFromSheet(identifiers: string | string[]): Promise<boolean> {
    try {
      const ids = Array.isArray(identifiers) ? identifiers : [identifiers];
      const res = await fetch('/api/sheets/delete-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Error deleting triggers from Google Sheet:', err);
      return false;
    }
  },

  // Lưu đồng bộ toàn bộ danh sách lên Google Sheet
  async saveAllToSheet(triggers: Trigger[]): Promise<boolean> {
    try {
      const res = await fetch('/api/sheets/save-all-triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggers }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Error saving all triggers to Google Sheet:', err);
      return false;
    }
  },

  // Kích hoạt chạy trigger ngay lập tức (Manual run now)
  async runTriggerNow(triggerId: string): Promise<string> {
    const list = this.getAll();
    const trigger = list.find((t) => t.id === triggerId);
    if (!trigger) return 'Không tìm thấy trigger';

    let result = '';
    try {
      result = trigger.action === 'notify' ? await notifyFromTrigger(trigger) : await addNoteFromTrigger(trigger);
    } catch (err: any) {
      console.error('Run trigger now error:', err);
      result = `Lỗi: ${err?.message || 'Không thể thực thi'}`;
    }

    const nextRunAt = calculateNextRunAt(trigger.runAt, trigger.repeat);
    const updated: Trigger = {
      ...trigger,
      status: nextRunAt ? 'pending' : 'done',
      runAt: nextRunAt || trigger.runAt,
      firedAt: new Date().toISOString(),
      result: `[Chạy thủ công] ${result}`,
      updatedAt: new Date().toISOString(),
    };

    this.upsert(updated);
    this.updateInSheet(updated).catch(() => {});
    return result;
  },

  // Chạy các trigger đã đến giờ hẹn
  async runDueTriggers(): Promise<void> {
    await withExclusiveLock(async () => {
      const nowStr = `${toLocalDateStr()}T${toLocalTimeStr()}`;
      const due = this.getAll().filter((t) => t.status === 'pending' && t.runAt <= nowStr);

      for (const trigger of due) {
        let result: string;
        try {
          result = trigger.action === 'notify' ? await notifyFromTrigger(trigger) : await addNoteFromTrigger(trigger);
        } catch (err) {
          console.error('Trigger failed:', err);
          result = 'Lỗi khi chạy trigger';
        }

        const nextRunAt = calculateNextRunAt(trigger.runAt, trigger.repeat);
        const updated: Trigger = {
          ...trigger,
          status: nextRunAt ? 'pending' : 'done',
          runAt: nextRunAt || trigger.runAt,
          firedAt: new Date().toISOString(),
          result,
          updatedAt: new Date().toISOString(),
        };

        this.upsert(updated);
        this.updateInSheet(updated).catch(() => {});
      }
    });
  },

  // Bắt đầu kiểm tra định kỳ, trả về hàm dừng
  startScheduler(): () => void {
    const check = () => {
      this.runDueTriggers().catch((e) => console.warn('Trigger check failed:', e));
    };
    const handleVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    check();
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', handleVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  },
};
