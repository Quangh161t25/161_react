import React from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  SquarePen,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { WorkflowTemplate } from '../../../types/task';

interface WorkflowDetailDrawerProps {
  workflow: WorkflowTemplate;
  currentIndex: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (wf: WorkflowTemplate) => void;
  onDelete: (id: string) => void;
}

export const WorkflowDetailDrawer: React.FC<WorkflowDetailDrawerProps> = ({
  workflow,
  currentIndex,
  totalCount,
  onClose,
  onPrev,
  onNext,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 md:pl-10">
        <div className="w-full md:max-w-2xl flex flex-col bg-card border-l border-border shadow-2xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                {workflow.code}
              </span>
              <h2 className="text-sm font-semibold truncate text-foreground">
                {workflow.name}
              </h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrev}
                disabled={currentIndex <= 0}
                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] px-1 font-mono text-muted-foreground">
                {currentIndex + 1}/{totalCount}
              </span>
              <button
                type="button"
                onClick={onNext}
                disabled={currentIndex >= totalCount - 1}
                className="p-1 rounded text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 custom-scrollbar">
            <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-foreground">{workflow.name}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                    workflow.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {workflow.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {workflow.description || 'Chưa có mô tả chi tiết.'}
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground border-t border-border/50">
                <span>Phân loại: <strong className="text-foreground">{workflow.category}</strong></span>
                <span>Phòng ban: <strong className="text-foreground">{workflow.department}</strong></span>
              </div>
            </div>

            {/* Visual Workflow Steps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider border-b border-primary/20 pb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Trình tự các bước thực hiện chuẩn</span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-primary/30">
                {workflow.steps.map((st) => (
                  <div key={st.stepNumber} className="relative flex items-start gap-3">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-sm">
                      {st.stepNumber}
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3.5 flex-1 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">{st.title}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/20">
                          SLA: {st.estimatedDays} ngày
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Vai trò phụ trách: <strong className="text-foreground">{st.defaultAssigneeRole}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-border bg-background hover:bg-muted text-foreground text-xs font-medium"
            >
              Đóng
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(workflow)}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1.5"
              >
                <SquarePen className="w-3.5 h-3.5" />
                <span>Sửa quy trình</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Xoá quy trình "${workflow.name}"?`)) {
                    onDelete(workflow.id);
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
