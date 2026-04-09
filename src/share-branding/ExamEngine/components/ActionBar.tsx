import { ChevronLeft, ChevronRight, Flag } from 'lucide-react';
import { MacOSDots } from './MacOSDots';

const ELITE_BAR_BG = '#0d2561';

interface ActionBarProps {
  primaryAccent: string;
  onNavigatorToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function ActionBar({ primaryAccent, onNavigatorToggle, onNext, onPrevious }: ActionBarProps) {
  return (
    <div 
      className="h-[64px] px-8 flex items-center justify-between fixed bottom-0 left-0 right-0 z-40"
      style={{ backgroundColor: ELITE_BAR_BG }}
    >
      {/* Left: Legend & Navigator + Mark for Review */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onNavigatorToggle}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
        >
          <MacOSDots />
          <span className="text-sm font-medium">Legend & Navigator</span>
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
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
          style={{ backgroundColor: primaryAccent }}
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
    </div>
  );
}
