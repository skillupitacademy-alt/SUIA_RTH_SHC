import { CodeEditor } from './CodeEditor';
import { MacOSDots } from './MacOSDots';
import { ExamCardTheme } from './cardThemes';

interface QuestionPaneProps {
  questionNumber: number;
  questionText: string;
  code?: string;
  primaryAccent: string;
  secondaryAccent: string;
  cardTheme: ExamCardTheme;
}

export function QuestionPane({
  questionNumber,
  questionText,
  code,
  primaryAccent,
  secondaryAccent,
  cardTheme,
}: QuestionPaneProps) {
  const questionId = String(questionNumber).padStart(2, '0');
  
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: cardTheme.questionSurface }}>
      <div 
        className="z-10 flex items-center justify-between px-4 py-3 shadow-md"
        style={{ backgroundColor: secondaryAccent }}
      >
        <MacOSDots />
        <div className="text-[10px] uppercase tracking-[0.2em] font-black text-white">
          Expert Inquiry {questionId}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <h2 className="mb-4 text-xl font-bold tracking-tight sm:mb-6 sm:text-2xl" style={{ color: cardTheme.questionText }}>
            {questionText}
          </h2>
          {code && (
            <div className="mt-4 sm:mt-6">
              <CodeEditor code={code} primaryAccent={primaryAccent} size="large" cardTheme={cardTheme} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
