import { CalendarEvent } from '../types/calendar';
import { taskService, projectService } from './taskService';
import { googleSheetsService } from './googleSheetsService';
import { cashTransactionService } from './cashTransactionService';
import { employeeService } from './employeeService';
import { noteService } from './noteService';

const CUSTOM_EVENTS_KEY = 'erp_custom_calendar_events';

export const INITIAL_CUSTOM_EVENTS: CalendarEvent[] = [];

export const calendarService = {
  // Get user-created custom calendar events
  getCustomEvents(): CalendarEvent[] {
    try {
      const stored = localStorage.getItem(CUSTOM_EVENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Lọc bỏ các sự kiện họp giả định mẫu cũ
          return parsed.filter((e: CalendarEvent) => e.id !== 'evt_001' && e.id !== 'evt_002');
        }
      }
    } catch {}
    return [];
  },

  saveCustomEvents(events: CalendarEvent[]): void {
    try {
      localStorage.setItem(CUSTOM_EVENTS_KEY, JSON.stringify(events));
    } catch (e) {
      console.error('Failed to save custom calendar events:', e);
    }
  },

  addCustomEvent(event: CalendarEvent): CalendarEvent[] {
    const current = this.getCustomEvents();
    const updated = [event, ...current];
    this.saveCustomEvents(updated);
    return updated;
  },

  deleteCustomEvent(id: string): CalendarEvent[] {
    const current = this.getCustomEvents();
    const updated = current.filter((e) => e.id !== id);
    this.saveCustomEvents(updated);
    return updated;
  },

  // ------------------------------------------------------------------
  // AGGREGATE ALL EVENTS FROM ALL MODULES
  // ------------------------------------------------------------------
  aggregateAllEvents(): CalendarEvent[] {
    const events: CalendarEvent[] = [];

    // 1. Module Công việc (Tasks)
    try {
      const tasks = taskService.getInitialTasks();
      tasks.forEach((t) => {
        if (t.dueDate) {
          events.push({
            id: `task_due_${t.id}`,
            title: `[Hạn chót] ${t.title}`,
            startDate: t.dueDate,
            allDay: true,
            source: 'work_task',
            sourceId: t.code,
            sourceLink: '/cong-viec/danh-sach',
            categoryName: 'Hạn chót Công việc',
            badgeBg: 'bg-blue-500/10',
            badgeColor: 'text-blue-600',
            badgeBorder: 'border-blue-500/20',
            description: `Dự án: ${t.projectName || '—'} | Tiến độ: ${t.progress}% | Người làm: ${t.assigneeName || '—'}`,
            assigneeId: t.assigneeId,
            assigneeCode: t.assigneeCode,
            assigneeName: t.assigneeName,
            department: t.department,
            status: t.status === 'completed' ? 'Đã xong' : t.status === 'in_progress' ? 'Đang làm' : 'Chưa xong',
            priority: t.priority as any,
            isCompleted: t.status === 'completed',
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating tasks to calendar:', e);
    }

    // 2. Module Dự án (Projects)
    try {
      const projects = projectService.getInitialProjects();
      projects.forEach((p) => {
        if (p.endDate) {
          events.push({
            id: `proj_end_${p.id}`,
            title: `[Bàn giao Dự án] ${p.name}`,
            startDate: p.endDate,
            allDay: true,
            source: 'work_project',
            sourceId: p.code,
            sourceLink: '/cong-viec/du-an',
            categoryName: 'Dự án Bàn giao',
            badgeBg: 'bg-cyan-500/10',
            badgeColor: 'text-cyan-600',
            badgeBorder: 'border-cyan-500/20',
            description: `Khách hàng: ${p.customerName || '—'} | Giám đốc DA: ${p.managerName || '—'} | Ngân sách: ${(p.budget || 0).toLocaleString('vi-VN')} đ`,
            assigneeId: p.managerId,
            assigneeCode: p.managerCode,
            assigneeName: p.managerName,
            department: p.department,
            amount: p.budget,
            status: p.status === 'completed' ? 'Đã hoàn thành' : 'Đang triển khai',
            priority: p.priority as any,
            isCompleted: p.status === 'completed',
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating projects to calendar:', e);
    }

    // 3. Module Tài chính: Đề xuất chi phí (Cost Proposals)
    try {
      const proposals = googleSheetsService.getInitialProposals();
      proposals.forEach((prop) => {
        const d = prop.proposalDate;
        if (d) {
          // Normalize date format (YYYY-MM-DD)
          const cleanDate = d.includes('/')
            ? d.split('/').reverse().join('-')
            : d.slice(0, 10);

          events.push({
            id: `prop_${prop.id}`,
            title: `[Đề xuất CP] ${prop.title || prop.code}`,
            startDate: cleanDate,
            allDay: true,
            source: 'finance_proposal',
            sourceId: prop.code,
            sourceLink: '/tai-chinh/de-xuat-chi-phi',
            categoryName: 'Đề xuất Chi phí',
            badgeBg: 'bg-emerald-500/10',
            badgeColor: 'text-emerald-600',
            badgeBorder: 'border-emerald-500/20',
            description: `Người đề xuất: ${prop.proposer || '—'} | Số tiền: ${(prop.amount || 0).toLocaleString('vi-VN')} đ | Trạng thái: ${prop.status}`,
            assigneeId: prop.proposerId,
            assigneeCode: prop.proposerCode,
            assigneeName: prop.proposer,
            department: prop.department,
            amount: prop.amount,
            status: prop.status,
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating proposals to calendar:', e);
    }

    // 4. Module Tài chính: Thu chi tiền mặt & Ngân hàng (Cash Transactions)
    try {
      const txs = cashTransactionService.getInitialTransactions();
      txs.forEach((tx) => {
        if (tx.transactionDate) {
          const cleanDate = tx.transactionDate.slice(0, 10);
          const isThu = tx.type === 'income';
          events.push({
            id: `tx_${tx.id}`,
            title: `[${isThu ? 'Thu quỹ' : 'Chi quỹ'}] ${tx.title || tx.reason || tx.code}`,
            startDate: cleanDate,
            time: tx.transactionTime || undefined,
            allDay: !tx.transactionTime,
            source: 'finance_cash',
            sourceId: tx.code,
            sourceLink: '/tai-chinh/thu-chi',
            categoryName: isThu ? 'Phiếu Thu Quỹ' : 'Phiếu Chi Quỹ',
            badgeBg: isThu ? 'bg-emerald-500/10' : 'bg-rose-500/10',
            badgeColor: isThu ? 'text-emerald-600' : 'text-rose-600',
            badgeBorder: isThu ? 'border-emerald-500/20' : 'border-rose-500/20',
            description: `Đối tượng: ${tx.counterpartyName || '—'} | Số tiền: ${(tx.amount || 0).toLocaleString('vi-VN')} đ | Tài khoản: ${tx.account || '—'}`,
            assigneeId: tx.counterpartyId,
            assigneeCode: tx.counterpartyCode,
            assigneeName: tx.counterpartyName,
            amount: tx.amount,
            status: tx.status,
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating cash transactions to calendar:', e);
    }

    // 5. Module Nhân sự: Sinh nhật nhân viên & Ngày vào làm
    try {
      const employees = employeeService.getInitialEmployees();
      const currentYear = new Date().getFullYear();

      employees.forEach((emp) => {
        // Sinh nhật nhân viên
        if (emp.dob) {
          const raw = emp.dob.replace(/\//g, '-');
          const parts = raw.split('-');
          let month = '';
          let day = '';
          if (parts.length >= 2) {
            if (parts[0].length === 4) {
              month = parts[1];
              day = parts[2];
            } else {
              day = parts[0];
              month = parts[1];
            }
          }
          if (month && day) {
            const birthdayThisYear = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            events.push({
              id: `emp_birth_${emp.id}`,
              title: `🎂 Sinh nhật: ${emp.name}`,
              startDate: birthdayThisYear,
              allDay: true,
              source: 'hr_birthday',
              sourceId: emp.code,
              sourceLink: '/he-thong/nhan-vien',
              categoryName: 'Sinh nhật Nhân sự',
              badgeBg: 'bg-pink-500/10',
              badgeColor: 'text-pink-600',
              badgeBorder: 'border-pink-500/20',
              description: `Phòng ban: ${emp.department || '—'} | Chức danh: ${emp.role || '—'} | Email: ${emp.email || '—'}`,
              assigneeId: emp.id,
              assigneeCode: emp.code,
              assigneeName: emp.name,
              department: emp.department,
            });
          }
        }
      });
    } catch (e) {
      console.warn('Error aggregating employee events to calendar:', e);
    }

    // 6. Module Ghi chú & Lịch nhắc (Notes)
    try {
      const notes = noteService.getInitialNotes();
      notes.forEach((n) => {
        const d = n.noteDate || n.updatedAt || n.createdAt;
        if (d) {
          const cleanDate = d.slice(0, 10);
          events.push({
            id: `note_${n.id}`,
            title: `📝 [Ghi chú] ${n.title}`,
            startDate: cleanDate,
            allDay: true,
            source: 'note',
            sourceId: n.code,
            sourceLink: '/ghi-chu',
            categoryName: 'Ghi chú & Tài liệu',
            badgeBg: 'bg-purple-500/10',
            badgeColor: 'text-purple-600',
            badgeBorder: 'border-purple-500/20',
            description: (n.content || '').substring(0, 100) + '...',
            assigneeId: n.authorId,
            assigneeCode: n.authorCode,
            assigneeName: n.author,
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating notes to calendar:', e);
    }

    // 7. Custom Calendar Events (Lịch họp & Sự kiện riêng)
    const custom = this.getCustomEvents();
    events.push(...custom);

    return events;
  },
};
