import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Hammer,
  RotateCcw,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { LearningEntry } from '../../types/learning';

interface LearningStatsTabProps {
  entries: LearningEntry[];
  onSelectEntry: (entry: LearningEntry) => void;
}

export const LearningStatsTab: React.FC<LearningStatsTabProps> = ({ entries, onSelectEntry }) => {
  const total = entries.length;

  const countByMastery = {
    learning: entries.filter((e) => e.masteryLevel === 'learning').length,
    practicing: entries.filter((e) => e.masteryLevel === 'practicing').length,
    mastered: entries.filter((e) => e.masteryLevel === 'mastered').length,
    review_needed: entries.filter((e) => e.masteryLevel === 'review_needed').length,
  };

  // Due for review (nextReviewDate <= today)
  const todayStr = new Date().toISOString().split('T')[0];
  const dueForReview = entries.filter((e) => e.nextReviewDate && e.nextReviewDate <= todayStr);

  // Group by category
  const categoryCounts: Record<string, number> = {};
  entries.forEach((e) => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  // Group by source type
  const sourceCounts: Record<string, number> = {};
  entries.forEach((e) => {
    sourceCounts[e.sourceType] = (sourceCounts[e.sourceType] || 0) + 1;
  });
  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Tổng bài học</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground">kiến thức</span>
          </div>
        </div>

        {/* Mastered */}
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Đã nắm vững</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {countByMastery.mastered}
            </span>
            <span className="text-xs text-muted-foreground">
              {total > 0 ? `(${Math.round((countByMastery.mastered / total) * 100)}%)` : ''}
            </span>
          </div>
        </div>

        {/* Practicing / Learning */}
        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Đang thực hành / học</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Hammer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {countByMastery.learning + countByMastery.practicing}
            </span>
            <span className="text-xs text-muted-foreground">bài học</span>
          </div>
        </div>

        {/* Needs Review */}
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-700 dark:text-rose-300">Đến hạn ôn tập</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {dueForReview.length}
            </span>
            <span className="text-xs text-muted-foreground">cần xem lại</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Breakdown */}
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-primary" />
            <span>Phân bố theo Chuyên mục</span>
          </h3>

          {sortedCategories.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Chưa có dữ liệu chuyên mục</p>
          ) : (
            <div className="space-y-3">
              {sortedCategories.map(([cat, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-foreground">{cat}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source Types Breakdown */}
        <div className="p-4 sm:p-5 rounded-xl border border-border bg-card shadow-xs">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span>Nguồn học tập hiệu quả nhất</span>
          </h3>

          {sortedSources.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">Chưa có dữ liệu nguồn</p>
          ) : (
            <div className="space-y-3">
              {sortedSources.map(([st, count]) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={st} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-foreground">{st}</span>
                      <span className="text-muted-foreground">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Due for Review List */}
      {dueForReview.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>Kiến thức cần ôn tập hôm nay (Spaced Repetition)</span>
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {dueForReview.length} bài học
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {dueForReview.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectEntry(item)}
                className="p-3 rounded-lg border border-amber-500/20 bg-background hover:border-amber-500 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="font-mono font-semibold">{item.code}</span>
                  <span className="text-rose-500 font-medium">Hạn: {item.nextReviewDate}</span>
                </div>
                <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {item.title}
                </h4>
                {item.summary && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{item.summary}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
