import React from 'react';
import {
  FileText,
  Pin,
  Table as TableIcon,
  MapPin,
  Tag,
  FolderOpen,
  PieChart,
} from 'lucide-react';
import { Note } from '../../types/note';
import { NOTE_CATEGORIES } from '../../data/notes';

interface NoteStatsTabProps {
  notes: Note[];
}

export const NoteStatsTab: React.FC<NoteStatsTabProps> = ({ notes }) => {
  const total = notes.length;
  const pinnedCount = notes.filter((n) => n.isPinned).length;
  const tableCount = notes.filter((n) => n.tableData && n.tableData.columns?.length > 0).length;
  const locationCount = notes.filter((n) => n.location || n.coordinates).length;
  const attachmentCount = notes.reduce(
    (acc, n) => acc + (n.attachments?.length || 0) + (n.images?.length || 0),
    0
  );
  const publishedCount = notes.filter((n) => n.status === 'published').length;
  const draftCount = notes.filter((n) => n.status === 'draft').length;

  // Group by category
  const categoryStats = NOTE_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = notes.filter((n) => n.category === cat).length;
    return acc;
  }, {} as { [cat: string]: number });

  // Group by tags
  const tagStats = notes.reduce((acc, n) => {
    (n.tags || []).forEach((t) => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as { [tag: string]: number });

  const sortedTags = Object.entries(tagStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  return (
    <div className="space-y-6 p-4 md:p-6 overflow-y-auto">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tổng bài viết & Ghi chú</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{total}</h3>
              <span className="text-xs font-medium text-primary">
                {publishedCount} xuất bản
              </span>
            </div>
          </div>
        </div>

        {/* Wiki Tables */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <TableIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Bài có Bảng dữ liệu Wiki</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{tableCount}</h3>
              <span className="text-xs font-medium text-purple-600">
                {total > 0 ? Math.round((tableCount / total) * 100) : 0}% tổng số
              </span>
            </div>
          </div>
        </div>

        {/* Pinned Notes */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Pin className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Ghi chú ghim ưu tiên</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{pinnedCount}</h3>
              <span className="text-xs font-medium text-amber-600">
                {draftCount > 0 ? `${draftCount} bản nháp` : 'Ưu tiên cao'}
              </span>
            </div>
          </div>
        </div>

        {/* GPS Location & Attachments */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Có vị trí & Đính kèm</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h3 className="text-2xl font-extrabold text-foreground">{locationCount}</h3>
              <span className="text-xs font-medium text-emerald-600">
                {attachmentCount} tệp/ảnh
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-primary" />
              Cơ cấu Ghi chú theo Chuyên mục
            </h4>
            <span className="text-xs text-muted-foreground">{NOTE_CATEGORIES.length} chuyên mục</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {Object.entries(categoryStats).map(([cat, count]) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{cat}</span>
                    <span className="text-muted-foreground font-medium">
                      <strong className="text-foreground">{count}</strong> bài ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags Frequency & Content Distribution */}
        <div className="space-y-6">
          {/* Top Tags Frequency */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-primary" />
                Thẻ phân loại phổ biến (Tags)
              </h4>
              <span className="text-xs text-muted-foreground">{Object.keys(tagStats).length} thẻ</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {sortedTags.length > 0 ? (
                sortedTags.map(([tag, count]) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/50 border border-border text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
                  >
                    <span className="text-primary font-bold">#{tag}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-background text-muted-foreground font-bold border border-border">
                      {count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-3">Chưa có thẻ nào được gắn.</p>
              )}
            </div>
          </div>

          {/* Status & Elements Ratio */}
          <div className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <PieChart className="w-4 h-4 text-primary" />
              Tỷ lệ trạng thái tài liệu
            </h4>

            <div className="space-y-3 pt-1">
              <div className="flex h-3.5 rounded-full overflow-hidden w-full bg-muted">
                <div
                  className="bg-emerald-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (publishedCount / total) * 100 : 70}%` }}
                  title={`Đã xuất bản: ${publishedCount}`}
                />
                <div
                  className="bg-amber-500 transition-all duration-500"
                  style={{ width: `${total > 0 ? (draftCount / total) * 100 : 30}%` }}
                  title={`Bản nháp: ${draftCount}`}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Đã công bố ({publishedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Bản nháp ({draftCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span>Đính kèm ({attachmentCount})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
