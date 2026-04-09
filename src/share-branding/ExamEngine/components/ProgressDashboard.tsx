'use client';

interface ProgressDashboardProps {
  current: number;
  total: number;
  primaryAccent: string;
}

export function ProgressDashboard({ current, total, primaryAccent }: ProgressDashboardProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 xl:max-w-[270px] xl:gap-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 xl:min-w-[162px]">
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
      
      <div className="flex-shrink-0 text-left sm:text-right xl:min-w-[60px]">
        <div className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">Question</div>
        <div className="text-lg font-black leading-none text-white xl:text-[1.5rem]">
          {String(current).padStart(2, '0')}<span className="text-slate-300 text-sm font-medium ml-1">/ {total}</span>
        </div>
      </div>
    </div>
  );
}
