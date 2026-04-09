import { CodeEditor } from './CodeEditor';
import { MacOSDots } from './MacOSDots';

interface QuestionPaneProps {
  questionNumber: number;
  questionText: string;
  code?: string;
  primaryAccent: string;
  secondaryAccent: string;
}

export function QuestionPane({
  questionNumber,
  questionText,
  code,
  primaryAccent,
  secondaryAccent,
}: QuestionPaneProps) {
  const questionId = String(questionNumber).padStart(2, '0');
  
  return (
    <div className="flex flex-col h-full bg-white">
      <div 
        className="flex items-center justify-between px-4 py-3 shadow-md z-10"
        style={{ backgroundColor: secondaryAccent }}
      >
        <MacOSDots />
        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-white">
          Expert Inquiry {questionId}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 custom-scrollbar sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-slate-900 sm:mb-6 sm:text-2xl">
            {questionText}
          </h2>
          {code && (
            <div className="mt-4 sm:mt-6">
              <CodeEditor code={code} primaryAccent={primaryAccent} size="large" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
