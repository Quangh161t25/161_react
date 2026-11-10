export type TriggerAction = 'notify' | 'add_note' | 'webhook';

export type TriggerStatus = 'pending' | 'done' | 'cancelled';

export type TriggerPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TriggerRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Trigger {
  id: string;
  code: string; // e.g. TG-001 hoặc TG-001_8random
  title: string;
  content: string;
  action: TriggerAction;
  runAt: string; // Giờ máy người dùng, dạng YYYY-MM-DDTHH:mm
  runDate?: string; // dd/mm/yyyy
  runTime?: string; // HH:mm
  status: TriggerStatus;
  priority?: TriggerPriority;
  repeat?: TriggerRepeat;
  tags?: string[];
  isPinned?: boolean;
  result?: string; // Kết quả lần chạy
  firedAt?: string; // Thời điểm thực tế đã chạy
  note?: string; // Ghi chú thêm
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
}
