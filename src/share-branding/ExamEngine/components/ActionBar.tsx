import { ChevronLeft, ChevronRight, Flag, Monitor } from 'lucide-react';
import { MacOSDots } from './MacOSDots';
import { ProgressDashboard } from './ProgressDashboard';

const ELITE_BAR_BG = '#0d2561';

interface ActionBarProps {
  primaryAccent: string;
  current: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
  showTracker?: boolean;
  onToggleTracker?: () => void;
}

export function ActionBar({ 
  primaryAccent, 
  current, 
  total, 
  onNext, 
  onPrevious,
  showTracker = true,
  onToggleTracker
}: ActionBarProps) {
  return (
    <footer 
      className="sticky bottom-0 z-40 mt-4 border-t border-white/10 px-3 py-3 sm:px-4 lg:px-6"
      style={{ backgroundColor: ELITE_BAR_BG }}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
          <ProgressDashboard 
            current={current} 
            total={total} 
            primaryAccent={primaryAccent} 
          />
          
          <div className="hidden h-8 w-px bg-white/10 xl:block"></div>
          
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex">
            <button 
              onClick={onToggleTracker}
              className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2 transition-all ${
                showTracker ? 'border-white/20 text-white/70 hover:bg-white/10' : 'border-transparent bg-white/10 text-white'
              }`}
              title={showTracker ? "Hide Navigator" : "Show Navigator"}
            >
              <Monitor className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{showTracker ? 'Hide Tracker' : 'Show Tracker'}</span>
            </button>

            <button className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-white transition-colors hover:bg-white/10">
              <Flag className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">Mark for Review</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:w-auto">
          <button 
            onClick={onPrevious}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-2 text-white transition-colors hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Previous</span>
          </button>
          <button 
            onClick={onNext}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2 font-bold transition-opacity hover:opacity-90"
            style={{ 
              backgroundColor: primaryAccent,
              color: '#ffffff' 
            }}
          >
            <span className="text-sm">Save & Next</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
          <button 
            className="min-h-11 rounded-lg px-6 py-2 text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'white', color: ELITE_BAR_BG }}
          >
            Submit Assessment
          </button>
        </div>
      </div>
    </footer>
  );
}
