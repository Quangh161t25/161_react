import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  SquarePen,
  Trash2,
  Workflow,
  ChartColumn,
  RefreshCw,
  Printer,
  Bookmark,
  Download,
  LayoutGrid,
  ChevronDown,
  Tag,
  CircleCheck,
  Layers,
} from 'lucide-react';
import { WorkflowTemplate } from '../../../types/task';
import { workflowService } from '../../../services/taskService';
import { WorkflowFormDrawer } from './WorkflowFormDrawer';
import { WorkflowDetailDrawer } from './WorkflowDetailDrawer';

interface WorkflowListPageProps {
  onBack: () => void;
}

export const WorkflowListPage: React.FC<WorkflowListPageProps> = ({ onBack }) => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>(() =>
    workflowService.getInitialWorkflows()
  );
  const [activeTopTab, setActiveTopTab] = useState<'list' | 'stats'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Drawers
  const [selectedWfForDetail, setSelectedWfForDetail] = useState<WorkflowTemplate | null>(null);
  const [formDrawerState, setFormDrawerState] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    workflow?: WorkflowTemplate | null;
  }>({
    isOpen: false,
    mode: 'create',
  });

  useEffect(() => {
    let isMounted = true;
    workflowService.fetchFromSheet().then((data) => {
      if (isMounted && Array.isArray(data)) setWorkflows(data);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveWorkflow = (wf: WorkflowTemplate) => {
    let updated: WorkflowTemplate[];
    if (formDrawerState.mode === 'edit') {
      updated = workflows.map((w) => (w.id === wf.id ? wf : w));
    } else {
      updated = [wf, ...workflows];
    }
    setWorkflows(updated);
    workflowService.saveAllToSheet(updated);
    setFormDrawerState({ isOpen: false, mode: 'create' });
    showToast(`Đã lưu quy trình "${wf.name}"!`);
  };

  const handleDeleteWorkflow = (id: string) => {
    const updated = workflows.filter((w) => w.id !== id);
    setWorkflows(updated);
    workflowService.saveAllToSheet(updated);
    if (selectedWfForDetail?.id === id) {
      setSelectedWfForDetail(null);
    }
    showToast('Đã xóa quy trình.');
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      const live = await workflowService.fetchFromSheet();
      if (Array.isArray(live)) setWorkflows(live);
      showToast('Đã đồng bộ quy trình từ Google Sheet!');
    } catch {
      showToast('Đã tải từ bộ nhớ');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Mã quy trình', 'Tên quy trình', 'Phân loại', 'Số bước', 'Tổng SLA (ngày)', 'Trạng thái', 'Mô tả'];
    const rows = filteredWorkflows.map((w) => {
      const totalDays = w.steps.reduce((acc, s) => acc + (s.estimatedDays || 0), 0);
      return [
        `"${w.code}"`,
        `"${w.name.replace(/"/g, '""')}"`,
        `"${w.category}"`,
        w.steps.length,
        totalDays,
        w.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng',
        `"${(w.description || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_quy_trinh_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất file CSV thành công!');
  };

  const categories = useMemo(() => {
    const set = new Set(workflows.map((w) => w.category).filter(Boolean));
    return Array.from(set);
  }, [workflows]);

  const filteredWorkflows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return workflows.filter((w) => {
      if (q) {
        const matchCode = w.code.toLowerCase().includes(q);
        const matchName = w.name.toLowerCase().includes(q);
        const matchCat = w.category.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchCat) return false;
      }
      if (selectedCategory !== 'all' && w.category !== selectedCategory) return false;
      return true;
    });
  }, [workflows, searchQuery, selectedCategory]);

  return (
    <div className="flex-1 min-h-0 flex flex-col p-1.5 md:p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-foreground text-background text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CircleCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top View Tabs: Danh sách / Thống kê */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTopTab('list')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'list'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <Workflow className="w-3.5 h-3.5" />
          <span>Danh sách quy trình</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTopTab('stats')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTopTab === 'stats'
              ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
          }`}
        >
          <ChartColumn className="w-3.5 h-3.5" />
          <span>Thống kê</span>
        </button>
      </div>

      {/* Main Card Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden shadow-sm">
          {/* Header Bar Toolbar */}
          {activeTopTab === 'list' && (
            <div className="px-3 py-2 border-b border-border bg-card">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
                {/* Left: Back button, Search and Dropdowns */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="h-8 px-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                      title="Quay lại"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Quay lại</span>
                    </button>
                  )}

                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm theo mã, tên quy trình..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Filter: Category */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                      className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        selectedCategory !== 'all'
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{selectedCategory === 'all' ? 'Phân loại' : selectedCategory}</span>
                      <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
                    </button>
                    {isCatDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsCatDropdownOpen(false)} />
                        <div className="absolute left-0 top-full mt-1.5 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => { setSelectedCategory('all'); setIsCatDropdownOpen(false); }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                          >
                            Tất cả phân loại
                          </button>
                          {categories.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => { setSelectedCategory(c); setIsCatDropdownOpen(false); }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors truncate ${selectedCategory === c ? 'bg-primary text-primary-foreground font-semibold' : 'hover:bg-muted text-foreground'}`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-auto">
                  {/* Sync */}
                  <button
                    type="button"
                    onClick={handleSyncData}
                    disabled={isSyncing}
                    title="Đồng bộ Google Sheets"
                    className="h-8 px-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">
                      {isSyncing ? 'Đang đồng bộ...' : 'Google Sheet'}
                    </span>
                  </button>

                  {/* Print */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="In danh sách"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>

                  {/* Bookmark */}
                  <button
                    type="button"
                    title="Ghim mục"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Grid / Table Toggle */}
                  <button
                    type="button"
                    onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                    title={viewMode === 'table' ? 'Xem dạng lưới thẻ' : 'Xem dạng danh sách bảng'}
                    className={`h-8 w-8 flex items-center justify-center border rounded-lg transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    title="Xuất file CSV"
                    className="h-8 w-8 flex items-center justify-center border rounded-lg transition-all bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {/* Add Button */}
                  <button
                    type="button"
                    onClick={() => setFormDrawerState({ isOpen: true, mode: 'create' })}
                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List View: Grid / Table */}
          {activeTopTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {viewMode === 'grid' ? (
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredWorkflows.map((wf) => {
                      const totalDays = wf.steps.reduce((acc, s) => acc + (s.estimatedDays || 0), 0);

                      return (
                        <div
                          key={wf.id}
                          onClick={() => setSelectedWfForDetail(wf)}
                          className="group bg-card rounded-xl p-4 border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 flex flex-col justify-between"
                        >
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                {wf.code}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  wf.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {wf.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
                              </span>
                            </div>

                            <div>
                              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {wf.name}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {wf.description || 'Không có mô tả.'}
                              </p>
                            </div>

                            {/* Steps list */}
                            <div className="space-y-1 pt-1 text-xs">
                              <span className="text-muted-foreground text-[11px] font-medium">Các bước ({wf.steps.length}):</span>
                              <div className="flex flex-wrap items-center gap-1">
                                {wf.steps.map((st) => (
                                  <span
                                    key={st.stepNumber}
                                    className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[10px] font-medium border border-border/60"
                                  >
                                    {st.stepNumber}. {st.title}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/50 text-muted-foreground">
                              <div>
                                <span className="block text-[11px] opacity-70">Phân loại:</span>
                                <strong className="text-foreground">{wf.category}</strong>
                              </div>
                              <div>
                                <span className="block text-[11px] opacity-70">Tổng SLA:</span>
                                <strong className="text-foreground tabular-nums">{totalDays} ngày</strong>
                              </div>
                            </div>
                          </div>

                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2 border-t border-border/50 flex items-center justify-end gap-1"
                          >
                            <button
                              type="button"
                              onClick={() => setFormDrawerState({ isOpen: true, mode: 'edit', workflow: wf })}
                              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                            >
                              <SquarePen className="w-3.5 h-3.5" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Xoá quy trình "${wf.name}"?`)) {
                                  handleDeleteWorkflow(wf.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-50 text-muted-foreground hover:text-rose-600 text-xs flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Xoá</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/70 text-[11px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 z-10">
                        <th className="px-4 py-2.5 bg-muted/95">Mã QT</th>
                        <th className="px-4 py-2.5 bg-muted/95">Tên quy trình</th>
                        <th className="px-4 py-2.5 bg-muted/95">Phân loại</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">Số bước</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">SLA chuẩn</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95">Trạng thái</th>
                        <th className="px-4 py-2.5 text-center bg-muted/95 sticky right-0">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredWorkflows.map((w) => {
                        const totalDays = w.steps.reduce((acc, s) => acc + (s.estimatedDays || 0), 0);
                        return (
                          <tr
                            key={w.id}
                            onClick={() => setSelectedWfForDetail(w)}
                            className="hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-2.5 font-mono font-bold text-amber-600">{w.code}</td>
                            <td className="px-4 py-2.5 font-semibold text-foreground">{w.name}</td>
                            <td className="px-4 py-2.5 text-foreground">{w.category}</td>
                            <td className="px-4 py-2.5 text-center tabular-nums">{w.steps.length}</td>
                            <td className="px-4 py-2.5 text-center font-bold tabular-nums">{totalDays} ngày</td>
                            <td className="px-4 py-2.5 text-center">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  w.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-600'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {w.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}
                              </span>
                            </td>
                            <td
                              onClick={(e) => e.stopPropagation()}
                              className="px-4 py-2.5 text-center sticky right-0 bg-card shadow-[-1px_0_0_0_hsl(var(--border))]"
                            >
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setFormDrawerState({ isOpen: true, mode: 'edit', workflow: w })}
                                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                                  title="Sửa"
                                >
                                  <SquarePen className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Xoá quy trình "${w.name}"?`)) {
                                      handleDeleteWorkflow(w.id);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-rose-50 text-muted-foreground hover:text-rose-600"
                                  title="Xoá"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTopTab === 'stats' && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                    <Workflow className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Tổng số quy trình mẫu</p>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{workflows.length}</h3>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
                    <CircleCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Đang áp dụng</p>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">
                      {workflows.filter((w) => w.status === 'active').length}
                    </h3>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card shadow-sm flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Phân loại danh mục</p>
                    <h3 className="text-2xl font-extrabold text-foreground mt-0.5">{categories.length}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Form Drawer */}
      {formDrawerState.isOpen && (
        <WorkflowFormDrawer
          mode={formDrawerState.mode}
          workflow={formDrawerState.workflow}
          allWorkflows={workflows}
          onClose={() => setFormDrawerState({ isOpen: false, mode: 'create' })}
          onSave={handleSaveWorkflow}
        />
      )}

      {/* Detail Drawer */}
      {selectedWfForDetail && (
        <WorkflowDetailDrawer
          workflow={selectedWfForDetail}
          currentIndex={workflows.findIndex((w) => w.id === selectedWfForDetail.id)}
          totalCount={workflows.length}
          onClose={() => setSelectedWfForDetail(null)}
          onPrev={() => {
            const idx = workflows.findIndex((w) => w.id === selectedWfForDetail.id);
            if (idx > 0) setSelectedWfForDetail(workflows[idx - 1]);
          }}
          onNext={() => {
            const idx = workflows.findIndex((w) => w.id === selectedWfForDetail.id);
            if (idx < workflows.length - 1) setSelectedWfForDetail(workflows[idx + 1]);
          }}
          onEdit={(wf) => {
            setSelectedWfForDetail(null);
            setFormDrawerState({ isOpen: true, mode: 'edit', workflow: wf });
          }}
          onDelete={(id) => {
            handleDeleteWorkflow(id);
            setSelectedWfForDetail(null);
          }}
        />
      )}
    </div>
  );
};
