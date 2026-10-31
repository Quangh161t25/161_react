import { Note } from '../types/note';
import { Trigger } from '../types/trigger';
import { generateId } from '../utils/idGenerator';
import { toLocalDateStr, toLocalTimeStr } from '../utils/dateUtils';
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
    noteDate,
    noteTime,
    tags: ['Trigger'],
    author: 'Trigger tự động',
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

// Trên nhiều tab, chỉ một tab được chạy tại một thời điểm để trigger không chạy trùng
const withExclusiveLock = async (run: () => Promise<void>): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request('erp_triggers_lock', run);
  } else {
    await run();
  }
};

export const triggerService = {
  getAll(): Trigger[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Could not read triggers:', e);
      return [];
    }
  },

  saveAll(triggers: Trigger[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(triggers));
    } catch (e) {
      console.warn('Could not save triggers:', e);
    }
    window.dispatchEvent(new Event(TRIGGERS_CHANGED_EVENT));
  },

  upsert(trigger: Trigger): void {
    const others = this.getAll().filter((t) => t.id !== trigger.id);
    this.saveAll([trigger, ...others]);
  },

  remove(id: string): void {
    this.saveAll(this.getAll().filter((t) => t.id !== id));
  },

  async runDueTriggers(): Promise<void> {
    await withExclusiveLock(async () => {
      const nowStr = `${toLocalDateStr()}T${toLocalTimeStr()}`;
      const due = this.getAll().filter((t) => t.status === 'pending' && t.runAt <= nowStr);

      for (const trigger of due) {
        // Đánh dấu trước khi chạy: thà báo lỗi còn hơn thêm trùng ghi chú nếu trang bị đóng giữa chừng
        const started: Trigger = { ...trigger, status: 'done', firedAt: new Date().toISOString() };
        this.upsert(started);

        let result: string;
        try {
          result = trigger.action === 'notify' ? await notifyFromTrigger(trigger) : await addNoteFromTrigger(trigger);
        } catch (err) {
          console.error('Trigger failed:', err);
          result = 'Lỗi khi chạy trigger';
        }
        this.upsert({ ...started, result });
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
