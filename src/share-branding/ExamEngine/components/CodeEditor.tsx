interface CodeEditorProps {
  code: string;
  primaryAccent: string;
  size?: 'large' | 'mini';
}

export function CodeEditor({ code, primaryAccent, size = 'large' }: CodeEditorProps) {
  const maxHeight = size === 'large' ? 'max-h-[500px]' : 'max-h-[200px]';
  
  return (
    <div 
      className={`bg-slate-50 rounded-lg overflow-auto ${maxHeight} border-l-4 border border-slate-200`}
      style={{ borderLeftColor: primaryAccent }}
    >
      <pre className="p-4 text-sm font-mono text-slate-900 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}