import { MacOSDots } from './MacOSDots';
import { X } from 'lucide-react';

interface NavigatorProps {
  primaryAccent: string;
  currentQuestion: number;
  onClose: () => void;
}

export function Navigator({ primaryAccent, currentQuestion, onClose }: NavigatorProps) {
  const questions = Array.from({ length: 15 }, (_, i) => i + 1);
  
  const getQuestionStatus = (num: number) => {
    if (num === currentQuestion) return 'current';
    if (num < currentQuestion) return 'completed';
    if ([3, 7].includes(num)) return 'marked'; // Mock marked questions
    return 'unanswered';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#10b981', border: '#10b981', text: 'white' };
      case 'marked':
        return { bg: '#f59e0b', border: '#f59e0b', text: 'white' };
      case 'current':
        return { bg: 'white', border: primaryAccent, text: '#0f172a' };
      default:
        return { bg: 'white', border: '#cbd5e1', text: '#475569' };
    }
  };

  return (
    <div 
      className="fixed left-8 bg-white rounded-xl overflow-hidden"
      style={{ 
        bottom: '96px',
        width: '340px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <MacOSDots />
        <button 
          onClick={onClose}
          className="p-1 hover:bg-slate-200 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-600" />
        </button>
      </div>

      {/* Grid */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Question Navigator</h3>
        <div className="grid grid-cols-5 gap-3">
          {questions.map((num) => {
            const status = getQuestionStatus(num);
            const colors = getStatusColor(status);
            const isCurrent = status === 'current';
            
            return (
              <button
                key={num}
                className="aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-transform hover:scale-105"
                style={{
                  backgroundColor: colors.bg,
                  border: `2px solid ${colors.border}`,
                  color: colors.text,
                  fontWeight: isCurrent ? 'bold' : 'semibold',
                }}
              >
                {String(num).padStart(2, '0')}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-5 pt-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-4 h-4 rounded bg-[#10b981]"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-4 h-4 rounded bg-[#f59e0b]"></div>
            <span>Marked for Review</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="w-4 h-4 rounded border-2" style={{ borderColor: primaryAccent }}></div>
            <span>Current Question</span>
          </div>
        </div>
      </div>
    </div>
  );
}
