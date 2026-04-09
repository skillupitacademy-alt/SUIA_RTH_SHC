'use client';

import { MacOSDots } from './MacOSDots';

interface LegendCardProps {
  primaryAccent: string;
  currentQuestion: number;
  totalQuestions: number;
}

export function LegendCard({ primaryAccent, currentQuestion, totalQuestions }: LegendCardProps) {
  const questions = Array.from({ length: 20 }, (_, i) => i + 1); // Expanded to 20 for preview
  
  const getQuestionStatus = (num: number) => {
    if (num === currentQuestion) return 'current';
    if (num < currentQuestion) return 'completed';
    if ([3, 7].includes(num)) return 'marked';
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#10b981', border: '#10b981', text: 'white' };
      case 'marked':
        return { bg: '#f59e0b', border: '#f59e0b', text: '#0f172a' }; // Dark text for amber accessibility
      case 'current':
        return { bg: 'white', border: primaryAccent, text: '#0f172a' };
      default:
        return { bg: 'white', border: '#cbd5e1', text: '#475569' };
    }
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* Navigator Style Header (from Image 2) */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <MacOSDots />
        <div className="text-[10px] uppercase tracking-widest font-black text-slate-600">
          Live Tracker
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 overflow-auto custom-scrollbar">
        <h3 className="text-sm font-semibold text-slate-700 mb-5 tracking-tight">Question Navigator</h3>
        
        <div className="mb-6 grid w-full grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] sm:gap-3">
          {questions.map((num) => {
            const status = getQuestionStatus(num);
            const colors = getStatusColor(status);
            const isCurrent = status === 'current';
            
            return (
              <button
                key={num}
                aria-label={`Go to question ${num}`}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border-2 shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  // @ts-ignore
                  '--tw-ring-color': primaryAccent
                }}
              >
                {String(num).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Legend Key - Horizontal Layout */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap gap-x-5 gap-y-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#10b981] shadow-sm"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#f59e0b] shadow-sm"></div>
            <span>Marked</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
            <div className="w-3.5 h-3.5 rounded-sm border-2" style={{ borderColor: primaryAccent }}></div>
            <span>Current</span>
          </div>
        </div>
      </div>
    </div>
  );
}
