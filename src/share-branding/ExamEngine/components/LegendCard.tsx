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
    <div className="flex h-full flex-col bg-[#F3EFE7]">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[#D6C8B5] bg-[#E8E0D4] px-4 py-3">
        <MacOSDots />
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-tight text-[#6B5B4D]">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#10b981] shadow-sm"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#f59e0b] shadow-sm"></div>
            <span>Marked</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm border-2" style={{ borderColor: primaryAccent }}></div>
            <span>Current</span>
          </div>
        </div>
        <div className="text-right text-[10px] font-black uppercase tracking-widest text-[#3F3328]">
          Live Tracker
        </div>
      </div>

      <div className="custom-scrollbar flex flex-1 flex-col overflow-auto p-5">
        <div className="mb-6 grid w-full grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] sm:gap-3">
          {questions.map((num) => {
            const status = getQuestionStatus(num);
            const colors = getStatusColor(status);
            
            return (
              <button
                key={num}
                aria-label={`Go to question ${num}`}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border-2 shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: status === 'unanswered' ? '#FCFAF6' : colors.bg,
                  borderColor: status === 'unanswered' ? '#BFAE98' : colors.border,
                  color: status === 'unanswered' ? '#4B3F35' : colors.text,
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
      </div>
    </div>
  );
}
