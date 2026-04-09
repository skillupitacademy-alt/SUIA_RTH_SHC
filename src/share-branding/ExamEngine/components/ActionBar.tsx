import { BarChart3, ChevronLeft, ChevronRight, Flag, Monitor } from 'lucide-react';

const ELITE_BAR_BG = '#0d2561';

interface ActionBarProps {
  primaryAccent: string;
  onNext: () => void;
  onPrevious: () => void;
  showTracker?: boolean;
  onToggleTracker?: () => void;
  showOverview?: boolean;
  onToggleOverview?: () => void;
}

export function ActionBar({ 
  primaryAccent, 
  onNext, 
  onPrevious,
  showTracker = true,
  onToggleTracker,
  showOverview = true,
  onToggleOverview,
}: ActionBarProps) {
  return (
    <footer 
      className="sticky bottom-0 z-40 mt-4 border-t border-white/10 px-3 py-3 sm:px-4 lg:px-6 xl:fixed xl:bottom-0 xl:left-0 xl:right-0 xl:mt-0 xl:h-[60px] xl:px-4 xl:py-0"
      style={{ backgroundColor: ELITE_BAR_BG }}
    >
      <div className="flex flex-col gap-3 xl:grid xl:h-full xl:grid-cols-[minmax(360px,1fr)_minmax(540px,590px)] xl:items-center xl:gap-3 xl:pr-20">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-0 xl:grid-cols-3">
          <button 
            onClick={onToggleTracker}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-all xl:px-2.5 ${
              showTracker ? 'border-white/20 text-white/70 hover:bg-white/10' : 'border-transparent bg-white/10 text-white'
            }`}
            title={showTracker ? "Hide Navigator" : "Show Navigator"}
          >
            <Monitor className="h-4 w-4 shrink-0" />
            <span className="text-center text-sm font-medium leading-tight xl:text-[13px]">{showTracker ? 'Hide Tracker' : 'Show Tracker'}</span>
          </button>

          <button 
            onClick={onToggleOverview}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-all xl:px-2.5 ${
              showOverview ? 'border-white/20 text-white/70 hover:bg-white/10' : 'border-transparent bg-white/10 text-white'
            }`}
            title={showOverview ? 'Hide Overview' : 'Show Overview'}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="text-center text-sm font-medium leading-tight xl:text-[13px]">{showOverview ? 'Hide Overview' : 'Show Overview'}</span>
          </button>

          <button className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-white transition-colors hover:bg-white/10 xl:px-2.5">
            <Flag className="h-4 w-4 shrink-0" />
            <span className="text-center text-sm font-medium leading-tight xl:text-[13px]">Mark for Review</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-[minmax(136px,1fr)_minmax(172px,1.02fr)_minmax(184px,1.08fr)] xl:gap-2.5">
          <button 
            onClick={onPrevious}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-white/20 px-3.5 py-2 text-white transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap text-sm font-medium xl:text-[13px]">Previous</span>
          </button>
          <button 
            onClick={onNext}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 font-bold transition-opacity hover:opacity-90"
            style={{ 
              backgroundColor: primaryAccent,
              color: '#ffffff' 
            }}
          >
            <span className="whitespace-nowrap text-sm xl:text-[13px]">Save & Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
          <button 
            className="min-h-10 rounded-lg px-3.5 py-2 text-sm font-bold transition-opacity hover:opacity-90 xl:text-[13px]"
            style={{ backgroundColor: 'white', color: ELITE_BAR_BG }}
          >
            <span className="whitespace-nowrap">Submit Assessment</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
