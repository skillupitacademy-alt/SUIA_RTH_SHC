import { ExamCardTheme } from './cardThemes';

interface CodeEditorProps {
  code: string;
  primaryAccent: string;
  size?: 'large' | 'mini';
  cardTheme: ExamCardTheme;
}

export function CodeEditor({ code, primaryAccent, size = 'large', cardTheme }: CodeEditorProps) {
  const maxHeight = size === 'large' ? 'max-h-[500px]' : 'max-h-[450px]';
  
  return (
    <div 
      className={`overflow-auto rounded-lg border ${maxHeight}`}
      style={{ borderColor: cardTheme.codeBorder, backgroundColor: cardTheme.codeSurface }}
    >
      <pre className="p-4 font-mono text-sm leading-relaxed" style={{ color: cardTheme.codeText }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
