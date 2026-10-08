'use client';

interface DiagramBlockProps {
  title: string;
  diagram: string;
  caption?: string | null;
  accentColor?: string;
  ariaLabel?: string;
}

export function DiagramBlock({ title, diagram, caption, accentColor = '#2e7d72', ariaLabel }: DiagramBlockProps) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-[16px]"
      style={{ boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/25 px-6 py-4">
        <h2 className="font-outfit text-[15px] font-extrabold tracking-tight" style={{ color: accentColor }}>
          {title}
        </h2>
        <span className="rounded-full bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-600">
          Diagram
        </span>
      </div>
      <div className="space-y-4 px-6 py-5">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4">
          <pre className="m-0 overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-7 text-slate-800">
            {diagram}
          </pre>
        </div>
        {caption ? <p className="m-0 text-sm italic leading-7 text-slate-600">{caption}</p> : null}
      </div>
    </section>
  );
}
