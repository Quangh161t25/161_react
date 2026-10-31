export type TriggerAction = 'notify' | 'add_note';

export type TriggerStatus = 'pending' | 'done';

export interface Trigger {
  id: string;
  title: string;
  content: string;
  action: TriggerAction;
  runAt: string; // Giờ máy người dùng, dạng YYYY-MM-DDTHH:mm
  status: TriggerStatus;
  createdAt: string;
  firedAt?: string;
  result?: string; // Kết quả lần chạy, hiển thị trong lịch sử
}
