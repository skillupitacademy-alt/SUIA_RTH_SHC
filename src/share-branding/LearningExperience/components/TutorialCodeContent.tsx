'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Code2, Copy, Lightbulb, MessageCircle, Monitor, Star, Terminal, Check, Boxes } from 'lucide-react';
import type { BrandTutorialTheme, TutorialCodePayload } from '@quiz/types';

interface TutorialCodeContentProps {
  payload: TutorialCodePayload;
  theme: BrandTutorialTheme;
}

function html(value: string) {
  return { __html: value };
}

function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

function variantStyles(variant: string | undefined) {
  if (variant === 'value') {
    return { color: '#079447', backgroundColor: '#effaf4', borderColor: '#bfe8d1' };
  }
  if (variant === 'result') {
    return { color: '#a56b00', backgroundColor: '#fff9e9', borderColor: '#f4dba1' };
  }
  return { color: '#1554c7', backgroundColor: '#eef4ff', borderColor: '#c9d9ff' };
}

function TerminalWindow({ title, children, copySource }: { title: string; children: ReactNode; copySource?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!copySource) return;
    await navigator.clipboard?.writeText(copySource);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full overflow-hidden rounded-[11px] border border-[#172b52] bg-[#07142f] shadow-[0_8px_24px_rgba(7,20,47,0.12)]">
      <div className="flex min-h-[58px] items-center gap-3.5 border-b border-white/10 bg-[#0d1d40] px-[18px] text-[#f8fafc]">
        <div className="flex items-center gap-[7px]" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-sm font-bold leading-snug">{title}</span>
        {copySource ? (
          <button
            type="button"
            onClick={copy}
            className="ml-auto inline-flex items-center gap-[7px] rounded-md border border-white/15 px-3 py-2 text-[13px] font-bold text-white transition hover:border-white/25 hover:bg-white/10"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export function TutorialCodeContent({ payload, theme }: TutorialCodeContentProps) {
  const page = payload.page ?? { type: 'CODE + EXPLANATION', title: 'Code Example', introduction: '' };
  const code = payload.code ?? { language: 'Code', source: '' };
  const steps = Array.isArray(payload.explanation?.steps) ? payload.explanation.steps : [];
  const memory = payload.memoryModel;
  const columns = Array.isArray(memory?.columns) ? memory.columns : [];
  const nodes = Array.isArray(memory?.nodes) ? memory.nodes : [];
  const rows = [...new Set(nodes.map((node) => node.row))].sort((a, b) => a - b);
  const takeawayItems = Array.isArray(payload.takeaway?.items) ? payload.takeaway.items : [];

  return (
    <article className="w-full bg-white px-[5%] py-10 text-[#0b1b3d]">
      <header className="mb-[30px] w-full">
        <div className="mb-[13px] inline-flex items-center gap-[9px] rounded-[5px] px-2.5 py-[5px] text-[13px] font-extrabold leading-snug" style={{ color: theme.primaryDark, backgroundColor: withAlpha(theme.primary, '14') }}>
          <Code2 className="h-5 w-5" style={{ color: theme.primary }} />
          <span>{page.type || 'CODE + EXPLANATION'}</span>
        </div>
        <h1 className="text-[clamp(34px,4vw,52px)] font-extrabold leading-[1.1] tracking-[-1.1px]" style={{ color: theme.secondary }}>
          {page.title || 'Code Example'}
        </h1>
        <div className="mt-3 h-[3px] w-[34px] rounded-full" style={{ backgroundColor: theme.primary }} />
        {page.introduction && <p className="mt-[13px] max-w-[900px] text-[17px] font-medium leading-[1.65]" style={{ color: theme.secondary }}>{page.introduction}</p>}
      </header>

      <section className="mb-[30px] w-full">
        <div className="mb-[14px] flex items-center gap-2.5">
          <Terminal className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
          <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Code Example</h2>
        </div>
        <TerminalWindow title={code.language || 'Code'} copySource={code.source || ''}>
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <pre className="m-0 bg-[#07142f] px-[22px] pb-7 pt-6">
              <code className="block whitespace-pre font-mono text-base font-medium leading-[1.8] text-[#f8fafc]">{code.source || ''}</code>
            </pre>
          </div>
        </TerminalWindow>
      </section>

      {steps.length > 0 && (
        <section className="mb-[30px] w-full">
          <div className="mb-[14px] flex items-center gap-2.5">
            <MessageCircle className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
            <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Explanation</h2>
          </div>
          <div className="w-full overflow-hidden rounded-[10px] border bg-white" style={{ borderColor: withAlpha(theme.primary, '66') }}>
            {steps.map((step, index) => (
              <div key={`${step.number}-${step.code}`} className="grid min-h-20 w-full grid-cols-[48px_minmax(150px,250px)_minmax(0,1fr)] items-center border-b last:border-b-0" style={{ borderColor: withAlpha(theme.primary, '33') }}>
                <div className="ml-3 flex h-[35px] w-[35px] items-center justify-center rounded-full text-[15px] font-extrabold text-white" style={{ backgroundColor: theme.primary }}>
                  {step.number || index + 1}
                </div>
                <code className="inline-flex max-w-full justify-self-start rounded-md px-2.5 py-1.5 font-mono text-sm font-bold leading-snug" style={{ color: theme.primaryDark, backgroundColor: withAlpha(theme.primary, '14') }}>
                  {step.code}
                </code>
                <div className="px-5 py-[17px] pl-2.5 text-base font-medium leading-[1.65] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" style={{ color: theme.secondary }} dangerouslySetInnerHTML={html(step.description || '')} />
              </div>
            ))}
          </div>
        </section>
      )}

      {payload.output?.value && (
        <section className="mb-8 w-full">
          <div className="mb-[14px] flex items-center gap-2.5">
            <Monitor className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
            <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Output</h2>
          </div>
          <TerminalWindow title="Terminal">
            <pre className="m-0 whitespace-pre-wrap bg-[#07142f] p-[22px] font-mono text-base leading-[1.7] text-[#d7e2f5]">{payload.output.value}</pre>
          </TerminalWindow>
        </section>
      )}

      {memory && (
        <section className="mb-8 w-full">
          <div className="mb-[14px] flex items-center gap-2.5">
            <Boxes className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
            <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Memory / Model</h2>
          </div>
          {memory.description && <p className="mb-4 text-base font-medium leading-[1.65]" style={{ color: theme.secondary }}>{memory.description}</p>}
          {columns.length > 0 && nodes.length > 0 && (
            <div className="w-full overflow-x-auto rounded-[10px] border bg-white p-[22px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ borderColor: withAlpha(theme.primary, '66') }}>
              <div className="grid min-w-[760px] items-center justify-center gap-x-[26px] gap-y-[18px]" style={{ gridTemplateColumns: columns.map((column) => column.width ?? 'minmax(160px,1fr)').join(' ') }}>
                {columns.map((column) => (
                  <div key={column.id} className="min-h-[25px] text-base font-extrabold leading-snug" style={{ color: theme.primaryDark }}>{column.title}</div>
                ))}
                {rows.flatMap((row) => columns.map((column) => {
                  const node = nodes.find((item) => item.row === row && item.column === column.id);
                  return (
                    <div
                      key={`${row}-${column.id}`}
                      className="flex min-h-12 items-center justify-center rounded-lg border px-3.5 py-[9px] text-center text-[15px] font-bold leading-snug"
                      style={node ? { ...variantStyles(node.variant), fontFamily: node.monospace ? 'SFMono-Regular, Cascadia Code, Consolas, monospace' : undefined } : { borderColor: 'transparent' }}
                    >
                      {node?.label ?? ''}
                    </div>
                  );
                }))}
              </div>
            </div>
          )}
          {memory.note && <div className="mt-3 rounded-[7px] border border-[#dce5f8] bg-[#f6f8ff] px-[13px] py-2.5 text-[13px] font-semibold leading-[1.55]" style={{ color: theme.secondary }}>{memory.note}</div>}
        </section>
      )}

      {takeawayItems.length > 0 && (
        <section className="relative mb-6 w-full rounded-[10px] border py-[22px] pl-5 pr-[90px]" style={{ backgroundColor: '#fffaf0', borderColor: '#f0d9a2' }}>
          <div className="mb-3 flex items-center gap-[9px]">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <Star className="h-[13px] w-[13px] fill-current" />
            </span>
            <h2 className="text-lg font-extrabold leading-snug text-[#d97706]">Key Takeaway</h2>
          </div>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] font-medium leading-[1.55] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" style={{ color: theme.secondary }}>
            {takeawayItems.map((item, index) => (
              <li key={index} dangerouslySetInnerHTML={html(item)} />
            ))}
          </ul>
          <Lightbulb className="absolute bottom-[18px] right-[25px] h-12 w-12 text-[#f59e0b]" />
        </section>
      )}

      {payload.tip?.text && (
        <section className="w-full rounded-[10px] border border-[#d9e0ea] bg-[#f7f9fc] p-5">
          <div className="mb-[9px] flex items-center gap-[9px]">
            <Lightbulb className="h-[19px] w-[19px]" style={{ color: theme.primary }} />
            <h2 className="text-lg font-extrabold leading-snug" style={{ color: theme.secondary }}>Tip</h2>
          </div>
          <p className="text-[15px] font-medium leading-[1.65]" style={{ color: theme.secondary }}>{payload.tip.text}</p>
        </section>
      )}
    </article>
  );
}
