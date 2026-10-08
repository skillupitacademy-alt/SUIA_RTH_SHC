import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TextBlockProps {
  title: string;
  markdown: string;
  accentColor?: string;
  ariaLabel?: string;
}

export function TextBlock({ title, markdown, accentColor = '#3d5a9e', ariaLabel }: TextBlockProps) {
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
          Text
        </span>
      </div>
      <div className="prose prose-slate max-w-none px-6 py-5 prose-p:leading-7 prose-li:leading-7 prose-code:rounded prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </section>
  );
}
