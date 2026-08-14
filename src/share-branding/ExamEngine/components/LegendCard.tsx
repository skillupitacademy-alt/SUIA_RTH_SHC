'use client';

import { MacOSDots } from './MacOSDots';
import { ExamCardTheme } from './cardThemes';
import { ExamQuestionItem, ExamQuestionStatus } from './examSession';

interface LegendCardProps {
  primaryAccent: string;
  currentQuestionNumber: number;
  questions: ExamQuestionItem[];
  cardTheme: ExamCardTheme;
  onQuestionSelect?: (index: number) => void;
}

export function LegendCard({ primaryAccent, currentQuestionNumber, questions, cardTheme, onQuestionSelect }: LegendCardProps) {
  const getQuestionStatus = (question: ExamQuestionItem): ExamQuestionStatus | 'current' => {
    if (question.question.number === currentQuestionNumber) return 'current';
    return question.status;
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
        return { bg: cardTheme.trackerCellSurface, border: cardTheme.trackerCellBorder, text: cardTheme.trackerCellText };
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: cardTheme.trackerSurface }}>
      <div
        className="grid grid-cols-[auto_1fr] items-start gap-3 border-b px-4 py-3 sm:grid-cols-[auto_1fr_auto] sm:items-center"
        style={{ borderColor: cardTheme.trackerHeaderBorder, backgroundColor: cardTheme.trackerHeaderSurface }}
      >
        <MacOSDots />
        <div className="flex flex-wrap items-center justify-start gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-tight sm:justify-center" style={{ color: cardTheme.trackerHeaderText }}>
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#10b981] shadow-sm"></div>
            <span>Completed</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm bg-[#f59e0b] shadow-sm"></div>
            <span>Marked</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="w-3.5 h-3.5 rounded-sm border-2" style={{ borderColor: primaryAccent }}></div>
            <span>Current</span>
          </div>
        </div>
        <div className="col-span-2 text-right text-[10px] font-black uppercase tracking-widest sm:col-span-1" style={{ color: cardTheme.trackerTitleText }}>
          Live Tracker
        </div>
      </div>

      <div className="custom-scrollbar flex flex-1 flex-col overflow-auto p-4 sm:p-5">
        <div className="mb-6 grid w-full grid-cols-[repeat(auto-fill,minmax(38px,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(44px,1fr))] sm:gap-3">
          {questions.map((question, index) => {
            const status = getQuestionStatus(question);
            const colors = getStatusColor(status);
            
            return (
              <button
                key={question.id}
                aria-label={`Go to question ${question.question.number}`}
                onClick={() => onQuestionSelect?.(index)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all border-2 shadow-sm hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                  // @ts-ignore
                  '--tw-ring-color': primaryAccent
                }}
              >
                {String(question.question.number).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Legend Key - Horizontal Layout */}
      </div>
    </div>
  );
}
