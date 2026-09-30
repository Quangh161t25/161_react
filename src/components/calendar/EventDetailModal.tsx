import React from 'react';
import {
  X,
  ExternalLink,
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  DollarSign,
  Trash2,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToModule?: (link: string) => void;
  onDeleteCustomEvent?: (id: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onNavigateToModule,
  onDeleteCustomEvent,
}) => {
  if (!isOpen || !event) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col space-y-4 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${event.badgeBg} ${event.badgeColor} border ${event.badgeBorder}`}
            >
              <Layers className="w-3 h-3" />
              <span>{event.categoryName}</span>
            </span>
            <h2 className="text-base font-bold text-foreground leading-snug">
              {event.title}
            </h2>
            {event.sourceId && (
              <span className="font-mono text-xs font-bold text-primary block">
                Mã liên kết: {event.sourceId}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event Meta Details */}
        <div className="space-y-3 bg-muted/40 p-4 rounded-xl border border-border text-xs">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <span>Ngày: {event.startDate}</span>
            {event.endDate && event.endDate !== event.startDate && (
              <span>→ {event.endDate}</span>
            )}
          </div>

          {event.time && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-mono font-bold text-foreground">{event.time}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="text-foreground">{event.location}</span>
            </div>
          )}

          {event.assigneeName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                Người phụ trách / Liên quan:{' '}
                <strong className="text-foreground">
                  {event.assigneeName} {event.assigneeCode ? `(${event.assigneeCode})` : ''}
                </strong>
              </span>
            </div>
          )}

          {event.department && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Phòng ban: <strong className="text-foreground">{event.department}</strong></span>
            </div>
          )}

          {event.amount !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Số tiền: <strong className="text-emerald-600 font-mono text-sm">{event.amount.toLocaleString('vi-VN')} đ</strong></span>
            </div>
          )}

          {event.status && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span>Trạng thái: <span className="font-semibold text-foreground">{event.status}</span></span>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div className="p-3 bg-muted/20 rounded-xl border border-border text-xs text-foreground leading-relaxed whitespace-pre-line">
            {event.description}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-border">
          {event.source === 'custom' && onDeleteCustomEvent ? (
            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc muốn xóa lịch họp / sự kiện này?')) {
                  onDeleteCustomEvent(event.id);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa sự kiện</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Đóng
            </button>

            {event.sourceLink && onNavigateToModule && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToModule(event.sourceLink!);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold shadow-xs transition-all active:scale-95"
              >
                <span>Mở phân hệ liên kết</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
