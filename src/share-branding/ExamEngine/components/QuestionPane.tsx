import { CodeEditor } from './CodeEditor';
import { MacOSDots } from './MacOSDots';

interface QuestionPaneProps {
  questionNumber: number;
  questionText: string;
  code?: string;
  primaryAccent: string;
  secondaryAccent: string;
}

export function QuestionPane({ questionNumber, questionText, code, primaryAccent, secondaryAccent }: QuestionPaneProps) {
  const questionId = String(questionNumber).padStart(2, '0');
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Branded Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between shadow-md z-10"
        style={{ backgroundColor: secondaryAccent }}
      >
        <MacOSDots />
        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-white">
          Expert Inquiry {questionId}
        </div>
      </div>

      <div className="p-8 flex-1 overflow-auto custom-scrollbar">
        <div className="max-w-3xl">
          <h2 className="text-2xl text-slate-900 mb-6 font-bold tracking-tight">
            {questionText}
          </h2>
          {code && (
            <div className="mt-6">
              <CodeEditor code={code} primaryAccent={primaryAccent} size="large" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
