/**
 * Tutorial Composer Header Component
 * 
 * Displays the page title and document status indicator.
 * Minimal coupling - receives only loading state and block count.
 */

interface TutorialComposerHeaderProps {
  isLoadingDocument: boolean;
  documentBlockCount: number;
}

export function TutorialComposerHeader({ 
  isLoadingDocument, 
  documentBlockCount 
}: TutorialComposerHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#e11d48]">Tutorial Page Builder</p>
        <h1 className="text-xl font-extrabold text-[#071f63] font-outfit">Create & Append Block Instances</h1>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
        {isLoadingDocument ? (
          <span className="font-mono text-amber-600">
            Loading document…
          </span>
        ) : (
          <span className="font-mono text-slate-600">
            Document blocks: <strong>{documentBlockCount}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
