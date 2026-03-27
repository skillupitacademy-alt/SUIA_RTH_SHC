'use client';

import { useState } from 'react';

interface CodeBlockProps {
  title: string;
  language: string;
  intro?: string;
  code: string;
  steps?: string[];
  accentColor?: string;
  ariaLabel?: string;
}

export function CodeBlock({
  title,
  language,
  intro,
  code,
  steps = [],
  accentColor = '#546e7a',
  ariaLabel,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-label={ariaLabel ?? title}
      className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-[16px]"
      style={{ boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/25 px-6 py-4">
        <div className="min-w-0">
          <h2 className="font-outfit text-[15px] font-extrabold tracking-tight" style={{ color: accentColor }}>
            {title}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{language}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleCopy();
          }}
          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="space-y-4 px-6 py-5">
        {intro ? <p className="m-0 text-sm leading-7 text-slate-700">{intro}</p> : null}
        <div className="overflow-x-auto rounded-2xl bg-slate-950 px-5 py-4 text-slate-100 shadow-inner">
          <pre className="m-0 whitespace-pre-wrap font-mono text-[13px] leading-7">
            <code>{code}</code>
          </pre>
        </div>
        {steps.length > 0 ? (
          <div className="space-y-3">
            <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">Steps</div>
            <ol className="m-0 space-y-2 pl-5 text-sm leading-7 text-slate-700">
              {steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
