'use client';

interface ProgressDashboardProps {
  current: number;
  total: number;
  primaryAccent: string;
}

export function ProgressDashboard({ current, total, primaryAccent }: ProgressDashboardProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="flex items-center gap-6 min-w-[280px]">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-200 uppercase tracking-tighter">
          <span>Current Progress</span>
          <span className="text-white">{percentage}% COMPLETE</span>
        </div>
        
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div 
            className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)]"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: primaryAccent
            }}
          ></div>
        </div>
      </div>
      
      <div className="text-right flex-shrink-0">
        <div className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">Question</div>
        <div className="text-lg font-black text-white leading-none">
          {String(current).padStart(2, '0')}<span className="text-slate-300 text-sm font-medium ml-1">/ {total}</span>
        </div>
      </div>
    </div>
  );
}
