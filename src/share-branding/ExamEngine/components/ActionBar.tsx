import { BarChart3, ChevronLeft, ChevronRight, Flag, Monitor } from 'lucide-react';
import { CardThemeMode } from './cardThemes';
import { ThemeToggle } from './ThemeToggle';

interface ActionBarProps {
  primaryAccent: string;
  secondaryAccent: string;
  onNext: () => void;
  onPrevious: () => void;
  showTracker?: boolean;
  onToggleTracker?: () => void;
  showOverview?: boolean;
  onToggleOverview?: () => void;
  themeMode: CardThemeMode;
  onThemeChange: (mode: CardThemeMode) => void;
  onSubmit?: () => void;
  onToggleMark?: () => void;
  isMarked?: boolean;
  isSaving?: boolean;
  isSubmitting?: boolean;
}

export function ActionBar({ 
  primaryAccent, 
  secondaryAccent,
  onNext, 
  onPrevious,
  showTracker = true,
  onToggleTracker,
  showOverview = true,
  onToggleOverview,
  themeMode,
  onThemeChange,
  onSubmit,
  onToggleMark,
  isMarked = false,
  isSaving = false,
  isSubmitting = false,
}: ActionBarProps) {
  const chromeStyles = {
    'premium-white': {
      footerBackground: secondaryAccent,
      utilityBorder: 'rgba(255,255,255,0.22)',
      utilityText: 'rgba(255,255,255,0.82)',
      utilityHover: 'rgba(255,255,255,0.10)',
      utilityActiveBg: 'rgba(255,255,255,0.14)',
      utilityActiveText: '#FFFFFF',
      submitBg: '#FFFFFF',
      submitText: secondaryAccent,
    },
    'soft-sage': {
      footerBackground: secondaryAccent,
      utilityBorder: 'rgba(207,221,215,0.36)',
      utilityText: '#EEF3F1',
      utilityHover: 'rgba(238,243,241,0.12)',
      utilityActiveBg: 'rgba(238,243,241,0.18)',
      utilityActiveText: '#FFFFFF',
      submitBg: '#EEF3F1',
      submitText: secondaryAccent,
    },
    'warm-sage': {
      footerBackground: secondaryAccent,
      utilityBorder: 'rgba(214,200,181,0.34)',
      utilityText: '#F3EFE7',
      utilityHover: 'rgba(243,239,231,0.12)',
      utilityActiveBg: 'rgba(243,239,231,0.18)',
      utilityActiveText: '#FFFFFF',
      submitBg: '#F3EFE7',
      submitText: primaryAccent,
    },
    'high-clarity': {
      footerBackground: '#0F172A',
      utilityBorder: '#64748B',
      utilityText: '#F8FAFC',
      utilityHover: 'rgba(248,250,252,0.12)',
      utilityActiveBg: 'rgba(248,250,252,0.18)',
      utilityActiveText: '#FFFFFF',
      submitBg: '#FFFFFF',
      submitText: '#0F172A',
    },
  }[themeMode];

  return (
    <footer 
      className="sticky bottom-0 z-40 mt-4 border-t border-white/10 px-3 py-3 sm:px-4 lg:px-6 xl:fixed xl:bottom-0 xl:left-0 xl:right-0 xl:mt-0 xl:h-[60px] xl:px-4 xl:py-0"
      style={{ backgroundColor: chromeStyles.footerBackground, color: chromeStyles.utilityText }}
    >
      <div className="flex flex-col gap-3 xl:grid xl:h-full xl:grid-cols-[minmax(0,1fr)_minmax(0,500px)] xl:items-center xl:gap-3 2xl:pr-20">
        <div className="flex min-w-0 flex-col gap-2 xl:flex-row xl:items-center xl:gap-3">
          <ThemeToggle value={themeMode} onChange={onThemeChange} accentColor={primaryAccent} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-0 xl:flex-1 xl:grid-cols-3">
          <button 
            onClick={onToggleTracker}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-all xl:px-2.5"
            style={{
              borderColor: showTracker ? chromeStyles.utilityBorder : 'transparent',
              color: showTracker ? chromeStyles.utilityText : chromeStyles.utilityActiveText,
              backgroundColor: showTracker ? 'transparent' : chromeStyles.utilityActiveBg,
            }}
            title={showTracker ? "Hide Navigator" : "Show Navigator"}
          >
            <Monitor className="h-4 w-4 shrink-0" />
            <span className="text-center text-sm font-medium leading-tight xl:text-[13px]">{showTracker ? 'Hide Tracker' : 'Show Tracker'}</span>
          </button>

          <button 
            onClick={onToggleOverview}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-all xl:hidden"
            style={{
              borderColor: showOverview ? chromeStyles.utilityBorder : 'transparent',
              color: showOverview ? chromeStyles.utilityText : chromeStyles.utilityActiveText,
              backgroundColor: showOverview ? 'transparent' : chromeStyles.utilityActiveBg,
            }}
            title={showOverview ? 'Hide Overview' : 'Show Overview'}
          >
            <BarChart3 className="h-4 w-4 shrink-0" />
            <span className="text-center text-sm font-medium leading-tight xl:text-[13px]">{showOverview ? 'Hide Overview' : 'Show Overview'}</span>
          </button>

          <button
            onClick={onToggleMark}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors xl:px-2.5"
            style={{
              borderColor: isMarked ? '#f59e0b' : chromeStyles.utilityBorder,
              color: isMarked ? '#ffffff' : chromeStyles.utilityText,
              backgroundColor: isMarked ? '#f59e0b' : 'transparent',
            }}
          >
            <Flag className="h-4 w-4 shrink-0" />
            <span className="text-center text-sm font-medium leading-tight xl:text-[13px]">{isMarked ? 'Marked' : 'Mark for Review'}</span>
          </button>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-[minmax(112px,1fr)_minmax(136px,1.02fr)_minmax(152px,1.08fr)] xl:gap-2">
          <button 
            onClick={onPrevious}
            className="flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 transition-colors"
            style={{ borderColor: chromeStyles.utilityBorder, color: chromeStyles.utilityText, backgroundColor: 'transparent' }}
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium xl:text-[13px]">Previous</span>
          </button>
          <button 
            onClick={onNext}
            disabled={isSaving}
            className="flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 py-2 font-bold transition-opacity hover:opacity-90"
            style={{ 
              backgroundColor: primaryAccent,
              color: '#ffffff' 
            }}
          >
            <span className="truncate text-sm xl:text-[13px]">{isSaving ? 'Saving...' : 'Save & Next'}</span>
            <ChevronRight className="h-4 w-4 shrink-0" />
          </button>
          <button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="min-h-10 min-w-0 rounded-lg px-3 py-2 text-sm font-bold transition-opacity hover:opacity-90 xl:text-[13px]"
            style={{ backgroundColor: chromeStyles.submitBg, color: chromeStyles.submitText }}
          >
            <span className="block truncate">{isSubmitting ? 'Submitting...' : 'Submit Assessment'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
