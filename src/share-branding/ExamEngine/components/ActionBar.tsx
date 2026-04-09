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
      className="h-[64px] px-8 flex items-center justify-between fixed bottom-0 left-0 right-0 z-40"
      style={{ backgroundColor: ELITE_BAR_BG }}
    >
      {/* Left: Progress Dashboard + Workspace Toggle */}
      <div className="flex items-center gap-6">
        <ProgressDashboard 
          current={current} 
          total={total} 
          primaryAccent={primaryAccent} 
        />
        
        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
        
        <button 
          onClick={onToggleTracker}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            showTracker ? 'border-white/20 text-white/70 hover:bg-white/10' : 'border-transparent bg-white/10 text-white'
          }`}
          title={showTracker ? "Hide Navigator" : "Show Navigator"}
        >
          <Monitor className="w-4 h-4" />
          <span className="text-sm font-medium">{showTracker ? 'Hide Tracker' : 'Show Tracker'}</span>
        </button>

        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors">
          <Flag className="w-4 h-4" />
          <span className="text-sm font-medium">Mark for Review</span>
        </button>
      </div>

      {/* Center: Previous + Save & Next */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onPrevious}
          className="flex items-center gap-2 px-5 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Previous</span>
        </button>
        <button 
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: primaryAccent,
            color: '#ffffff' 
          }}
        >
          <span className="text-sm">Save & Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Submit Assessment */}
      <div>
        <button 
          className="px-6 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'white', color: ELITE_BAR_BG }}
        >
          Submit Assessment
        </button>
      </div>
    </footer>
  );
}
