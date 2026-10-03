import { CalendarEvent } from '../types/calendar';
import { taskService, projectService } from './taskService';
import { googleSheetsService } from './googleSheetsService';
import { cashTransactionService } from './cashTransactionService';
import { employeeService } from './employeeService';
import { noteService } from './noteService';
import { learningService } from './learningService';

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
            badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
            badgeColor: 'text-blue-800 dark:text-blue-300',
            badgeBorder: 'border-blue-400 dark:border-blue-600',
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
            badgeBg: 'bg-cyan-100 dark:bg-cyan-950/60',
            badgeColor: 'text-cyan-800 dark:text-cyan-300',
            badgeBorder: 'border-cyan-400 dark:border-cyan-600',
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
            badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
            badgeColor: 'text-orange-800 dark:text-orange-300',
            badgeBorder: 'border-orange-400 dark:border-orange-600',
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
            badgeBg: isThu ? 'bg-emerald-100 dark:bg-emerald-950/60' : 'bg-rose-100 dark:bg-rose-950/60',
            badgeColor: isThu ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300',
            badgeBorder: isThu ? 'border-emerald-400 dark:border-emerald-600' : 'border-rose-400 dark:border-rose-600',
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
              badgeBg: 'bg-amber-100 dark:bg-amber-950/60',
              badgeColor: 'text-amber-800 dark:text-amber-300',
              badgeBorder: 'border-amber-400 dark:border-amber-600',
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
          const rawText = (n.content || n.summary || '').trim();
          const cleanContent = rawText
            .replace(/!\[.*?\]\(.*?\)/g, '') // Bỏ ảnh markdown
            .replace(/<[^>]*>/g, '') // Bỏ thẻ HTML
            .trim();
          const displayDesc =
            n.summary && cleanContent && n.summary !== cleanContent
              ? `${n.summary}\n${cleanContent}`
              : cleanContent || n.summary || '';

          events.push({
            id: `note_${n.id}`,
            title: `📝 [Ghi chú] ${n.title}`,
            startDate: cleanDate,
            time: n.noteTime || undefined,
            allDay: !n.noteTime,
            source: 'note',
            sourceId: n.code,
            sourceLink: '/ghi-chu',
            categoryName: 'Ghi chú & Tài liệu',
            badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
            badgeColor: 'text-purple-800 dark:text-purple-300',
            badgeBorder: 'border-purple-400 dark:border-purple-600',
            description: displayDesc,
            assigneeId: n.authorId,
            assigneeCode: n.authorCode,
            assigneeName: n.author,
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating notes to calendar:', e);
    }

    // 7. Module Học hỏi & Kiến thức (Learning)
    try {
      const learnings = learningService.getInitialEntries();
      learnings.forEach((l) => {
        const d = l.entryDate || l.createdAt;
        if (d) {
          const cleanDate = d.slice(0, 10);
          events.push({
            id: `learning_${l.id}`,
            title: `🎓 [Học hỏi] ${l.title}`,
            startDate: cleanDate,
            allDay: true,
            source: 'learning',
            sourceId: l.code,
            sourceLink: '/hoc-hoi',
            categoryName: `Học hỏi: ${l.category || 'Kiến thức'}`,
            badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
            badgeColor: 'text-teal-800 dark:text-teal-300',
            badgeBorder: 'border-teal-400 dark:border-teal-600',
            description: l.summary || (l.content || '').substring(0, 100) + '...',
          });
        }
        if (l.nextReviewDate) {
          events.push({
            id: `learning_review_${l.id}`,
            title: `🔄 [Ôn tập kiến thức] ${l.title}`,
            startDate: l.nextReviewDate.slice(0, 10),
            allDay: true,
            source: 'learning',
            sourceId: l.code,
            sourceLink: '/hoc-hoi',
            categoryName: 'Ôn tập Kiến thức',
            badgeBg: 'bg-indigo-100 dark:bg-indigo-950/60',
            badgeColor: 'text-indigo-800 dark:text-indigo-300',
            badgeBorder: 'border-indigo-400 dark:border-indigo-600',
            description: `Mức độ nắm vững: ${l.masteryLevel || 'Đang học'}`,
          });
        }
      });
    } catch (e) {
      console.warn('Error aggregating learning entries to calendar:', e);
    }

    // 8. Custom Calendar Events (Lịch họp & Sự kiện riêng)
    const custom = this.getCustomEvents();
    events.push(...custom);

    return events;
  },

  // ------------------------------------------------------------------
  // UPDATE EVENT SCHEDULE ON DRAG & DROP (SNAP TO ROUNDED HOUR)
  // ------------------------------------------------------------------
  updateEventSchedule(
    eventId: string,
    newDateStr: string,
    newTimeStr?: string
  ): { success: boolean; message: string; eventTitle: string } {
    const all = this.aggregateAllEvents();
    const event = all.find((e) => e.id === eventId);
    if (!event) {
      return { success: false, message: 'Không tìm thấy sự kiện cần dời', eventTitle: '' };
    }

    // Không cho phép dời ngày sinh nhật nhân sự
    if (event.source === 'hr_birthday') {
      return {
        success: false,
        message: 'Sinh nhật nhân viên là ngày cố định theo hồ sơ, không thể dời ngày.',
        eventTitle: event.title,
      };
    }

    // Làm tròn giờ theo đúng yêu cầu: không có phút, chỉ có 10:00, 09:00, 11:00...
    let roundedTime: string | undefined = undefined;
    if (newTimeStr) {
      const match = newTimeStr.match(/^(\d{1,2})/);
      if (match) {
        const hh = match[1].padStart(2, '0');
        roundedTime = `${hh}:00`;
      }
    }

    let updated = false;

    // 1. Ghi chú (Note)
    if (event.source === 'note') {
      const nId = eventId.replace(/^note_/, '');
      const notes = noteService.getInitialNotes();
      const idx = notes.findIndex((n) => n.id === nId || n.code === event.sourceId);
      if (idx !== -1) {
        notes[idx].noteDate = newDateStr;
        if (roundedTime !== undefined) {
          notes[idx].noteTime = roundedTime;
        }
        notes[idx].updatedAt = new Date().toISOString();
        noteService.saveToCache(notes);
        updated = true;
      }
    }

    // 2. Sổ quỹ & Thu chi tiền mặt (Cash Transaction)
    else if (event.source === 'finance_cash') {
      const txId = eventId.replace(/^tx_/, '');
      const txs = cashTransactionService.getInitialTransactions();
      const idx = txs.findIndex((t) => t.id === txId || t.code === event.sourceId);
      if (idx !== -1) {
        txs[idx].transactionDate = newDateStr;
        if (roundedTime !== undefined) {
          txs[idx].transactionTime = roundedTime;
        }
        txs[idx].updatedAt = new Date().toISOString();
        cashTransactionService.saveToCache(txs);
        updated = true;
      }
    }

    // 3. Công việc & Deadline (Task)
    else if (event.source === 'work_task') {
      const tId = eventId.replace(/^task_due_/, '');
      const tasks = taskService.getInitialTasks();
      const idx = tasks.findIndex((t) => t.id === tId || t.code === event.sourceId);
      if (idx !== -1) {
        tasks[idx].dueDate = newDateStr;
        tasks[idx].updatedAt = new Date().toISOString();
        taskService.saveToCache(tasks);
        updated = true;
      }
    }

    // 4. Dự án (Project)
    else if (event.source === 'work_project') {
      const pId = eventId.replace(/^proj_end_/, '');
      const projects = projectService.getInitialProjects();
      const idx = projects.findIndex((p) => p.id === pId || p.code === event.sourceId);
      if (idx !== -1) {
        projects[idx].endDate = newDateStr;
        projects[idx].updatedAt = new Date().toISOString();
        projectService.saveToCache(projects);
        updated = true;
      }
    }

    // 5. Lịch họp & Sự kiện riêng (Custom Event)
    else if (event.source === 'custom') {
      const customs = this.getCustomEvents();
      const idx = customs.findIndex((c) => c.id === eventId);
      if (idx !== -1) {
        customs[idx].startDate = newDateStr;
        if (roundedTime !== undefined) {
          customs[idx].time = roundedTime;
          customs[idx].allDay = false;
        }
        this.saveCustomEvents(customs);
        updated = true;
      }
    }

    // 6. Học hỏi & Kiến thức (Learning)
    else if (event.source === 'learning') {
      const lId = eventId.replace(/^learning_review_/, '').replace(/^learning_/, '');
      const entries = learningService.getInitialEntries();
      const idx = entries.findIndex((l) => l.id === lId || l.code === event.sourceId);
      if (idx !== -1) {
        if (eventId.startsWith('learning_review_')) {
          entries[idx].nextReviewDate = newDateStr;
        } else {
          entries[idx].entryDate = newDateStr;
        }
        learningService.saveToCache(entries);
        updated = true;
      }
    }

    if (!updated) {
      return { success: false, message: 'Không thể cập nhật sự kiện này', eventTitle: event.title };
    }

    const timeInfo = roundedTime ? ` lúc ${roundedTime}` : '';
    const dateFormatted = newDateStr.split('-').reverse().join('/');
    return {
      success: true,
      message: `Đã dời "${event.title}" sang ngày ${dateFormatted}${timeInfo}`,
      eventTitle: event.title,
    };
  },
};
