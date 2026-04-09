import { CodeEditor } from './CodeEditor';

interface QuestionPaneProps {
  questionNumber: number;
  questionText: string;
  code?: string;
  primaryAccent: string;
}

export function QuestionPane({ questionNumber, questionText, code, primaryAccent }: QuestionPaneProps) {
  const questionId = String(questionNumber).padStart(2, '0');
  
  return (
    <div className="bg-white p-8 h-full overflow-auto">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-wider text-slate-600 mb-4 font-semibold">
          EXPERT INQUIRY {questionId}
        </div>
        <h2 className="text-2xl text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {questionText}
        </h2>
        {code && (
          <div className="mt-6">
            <CodeEditor code={code} primaryAccent={primaryAccent} size="large" />
          </div>
        )}
      </div>
    </div>
  );
}
