'use client';

interface ProgressOverviewCardProps {
  current: number;
  total: number;
  primaryAccent: string;
}

export function ProgressOverviewCard({
  current,
  total,
  primaryAccent,
}: ProgressOverviewCardProps) {
  const answered = current;
  const marked = Math.min(2, total);
  const remaining = Math.max(total - answered, 0);
  const percentage = Math.round((answered / total) * 100);

  const stats = [
    { label: 'Answered', value: String(answered).padStart(2, '0') },
    { label: 'Marked', value: String(marked).padStart(2, '0') },
    { label: 'Remaining', value: String(remaining).padStart(2, '0') },
    { label: 'Time Left', value: '45m' },
  ];

  return (
    <section className="h-full bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
          Progress Overview
        </div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">
          {percentage}% Complete
        </div>
      </div>

      <div className="flex h-full flex-col gap-4 p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {stat.label}
              </div>
              <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, backgroundColor: primaryAccent }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600 sm:text-sm">
            <span>Section: Web Foundations</span>
            <span>
              Question {answered} of {total}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
