'use client';

import { ExamCardTheme } from './cardThemes';
import { ExamProgressMetrics } from './examSession';

interface ProgressOverviewCardProps {
  primaryAccent: string;
  totalQuestions: number;
  progress: ExamProgressMetrics;
  cardTheme: ExamCardTheme;
}

export function ProgressOverviewCard({
  primaryAccent,
  totalQuestions,
  progress,
  cardTheme,
}: ProgressOverviewCardProps) {
  const percentage = totalQuestions > 0 ? Math.round((progress.answeredCount / totalQuestions) * 100) : 0;

  const stats = [
    { label: 'Answered', value: String(progress.answeredCount).padStart(2, '0') },
    { label: 'Marked', value: String(progress.markedCount).padStart(2, '0') },
    { label: 'Remaining', value: String(progress.remainingCount).padStart(2, '0') },
    { label: 'Time Left', value: progress.timeRemainingLabel },
  ];

  return (
    <section className="h-full" style={{ backgroundColor: cardTheme.overviewSurface }}>
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: cardTheme.overviewHeaderBorder, backgroundColor: cardTheme.overviewHeaderSurface }}>
        <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: cardTheme.overviewHeaderText }}>
          Progress Overview
        </div>
        <div className="shrink-0 text-[10px] font-black uppercase tracking-widest" style={{ color: cardTheme.overviewHeaderText }}>
          {percentage}% Complete
        </div>
      </div>

      <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border px-3 py-3"
              style={{ borderColor: cardTheme.overviewStatBorder, backgroundColor: cardTheme.overviewStatSurface }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] sm:tracking-[0.16em]" style={{ color: cardTheme.overviewStatLabel }}>
                {stat.label}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight" style={{ color: cardTheme.overviewStatValue }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full" style={{ backgroundColor: cardTheme.overviewStatBorder }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: primaryAccent }}
            />
          </div>
          <div className="flex flex-col gap-1 text-xs font-semibold sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-sm" style={{ color: cardTheme.overviewMetaText }}>
            <span className="max-w-full truncate sm:max-w-[60%]">Section: {progress.sectionLabel}</span>
            <span className="max-w-full truncate sm:shrink-0">{progress.metadataSummary}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
