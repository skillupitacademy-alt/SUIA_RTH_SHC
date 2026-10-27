import React from 'react';
import { BookOpen, Check, FileText, Lightbulb, Star, Table2 } from 'lucide-react';
import type { ISummaryBlock, BlockComponentProps } from '../types';
import type { TutorialSummaryPayload } from '@quiz/types';
import { SafeHtml } from '../../SafeHtml';
import { BlockShell, BlockHeader, CalloutBanner } from '../primitives';

function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

export function SummaryBlock({ block, className = '', theme, runtimeContext }: BlockComponentProps<ISummaryBlock>) {
  const content = block.content as any;
  const isRichS1 = Boolean(content?.revisionTable || content?.summary || content?.page?.badge);

  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'summary';
  const blockVersion = runtimeContext?.blockVersion ?? (('version' in block && (block as any).version) ? (block as any).version : 'S1');

  if (isRichS1) {
    const payload = content as TutorialSummaryPayload;
    const page = payload.page ?? { title: 'Revision Summary', introduction: '' };
    const summaryItems = Array.isArray(payload.summary) ? payload.summary : [];
    const columns = Array.isArray(payload.revisionTable?.columns) ? payload.revisionTable.columns : [];
    const rows = Array.isArray(payload.revisionTable?.rows) ? payload.revisionTable.rows : [];
    const quickTips = Array.isArray(payload.quickTips) ? payload.quickTips : [];
    const primary = theme?.primary || '#124fd6';
    const secondary = theme?.secondary || '#0b1b3d';
    const primaryDark = theme?.primaryDark || primary;

    return (
      <BlockShell
        id={blockId}
        className={className}
        theme={{ primary, secondary, primaryDark }}
        runtimeContext={runtimeContext}
        blockId={blockId}
        blockType={blockType}
        blockVersion={blockVersion}
      >
        <BlockHeader
          eyebrow={page.badge || 'REVISION & SUMMARY'}
          icon={BookOpen}
          badgeStyle="pill"
          title={page.title || 'Revision Summary'}
          headingLevel="h1"
          titleScale="hero"
          introduction={page.introduction}
          theme={{ primary, secondary, primaryDark }}
          className="mb-7"
        />

        {summaryItems.length > 0 && (
          <section className="my-8 w-full">
            <div className="mb-[14px] flex items-center gap-3">
              <FileText className="h-[23px] w-[23px]" style={{ color: primary }} />
              <h2 className="text-2xl font-extrabold leading-snug" style={{ color: secondary }}>Summary</h2>
            </div>
            <div className="w-full overflow-hidden rounded-[10px] border bg-white dark:bg-slate-800 shadow-[0_4px_16px_rgba(11,27,61,0.05)]" style={{ borderColor: withAlpha(primary, '66') }}>
              {summaryItems.map((item, index) => (
                <div key={index} className="grid min-h-[58px] grid-cols-[42px_minmax(0,1fr)] items-center border-b px-4 py-2.5 last:border-b-0 dark:border-slate-700" style={{ borderColor: withAlpha(primary, '33') }}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: primary }}>
                    <Check className="h-3 w-3 stroke-[4]" />
                  </span>
                  <SafeHtml as="div" html={item.text || ''} className="text-[15px] font-medium leading-[1.65] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" style={{ color: secondary }} />
                </div>
              ))}
            </div>
          </section>
        )}

        {columns.length > 0 && rows.length > 0 && (
          <section className="my-8 w-full">
            <div className="mb-[14px] flex items-center gap-3">
              <Table2 className="h-[23px] w-[23px]" style={{ color: primary }} />
              <h2 className="text-2xl font-extrabold leading-snug" style={{ color: secondary }}>Revision Table</h2>
            </div>
            <div className="w-full overflow-x-auto rounded-[10px] border bg-white dark:bg-slate-800 shadow-[0_4px_16px_rgba(11,27,61,0.05)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ borderColor: '#d9e0ea' }}>
              <div className="min-w-[920px] bg-white dark:bg-slate-800">
                <div className="grid min-h-[62px] grid-cols-[1.05fr_2fr_1.1fr_1.55fr] bg-[#0b1b3d] text-white">
                  {columns.slice(0, 4).map((column) => (
                    <div key={column.id} className="flex items-center gap-2.5 border-r border-white/20 px-4 py-3 text-[15px] font-bold leading-snug last:border-r-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}>
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </span>
                      <span>{column.title}</span>
                    </div>
                  ))}
                </div>

                {rows.map((row, index) => (
                  <div key={index} className="grid min-h-[105px] grid-cols-[1.05fr_2fr_1.1fr_1.55fr] border-b border-[#e5eaf1] dark:border-slate-700 bg-white dark:bg-slate-800 last:border-b-0">
                    <div className="flex min-w-0 items-center gap-3 border-r border-[#e5eaf1] dark:border-slate-700 px-4 py-[18px]">
                      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border-2 text-sm" style={{ borderColor: primary, backgroundColor: withAlpha(primary, '0d'), color: primary }}>
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <strong className="text-[15px] font-extrabold leading-snug" style={{ color: secondary }}>{row.concept?.name ?? ''}</strong>
                    </div>
                    <div className="min-w-0 border-r border-[#e5eaf1] dark:border-slate-700 px-4 py-[18px] text-sm leading-[1.65]" style={{ color: secondary }}>
                      <h3 className="mb-[5px] text-sm font-extrabold leading-snug">{row.keyPoint?.title ?? ''}</h3>
                      <SafeHtml as="p" html={row.keyPoint?.description ?? ''} className="font-medium" />
                      {row.keyPoint?.code && <code className="mt-2 inline-block rounded bg-[#f7f9fc] dark:bg-slate-900 px-2 py-1 font-mono text-[13px] font-bold" style={{ color: primaryDark }}>{row.keyPoint.code}</code>}
                    </div>
                    <div className="flex min-w-0 items-center border-r border-[#e5eaf1] dark:border-slate-700 px-4 py-[18px]">
                      {row.example?.code && <code className="inline-block max-w-full whitespace-pre-wrap rounded-md border border-[#d9e0ea] dark:border-slate-700 bg-[#f7f9fc] dark:bg-slate-900 px-[11px] py-[7px] font-mono text-[13px] font-bold leading-normal" style={{ color: '#124fd6' }}>{row.example.code}</code>}
                    </div>
                    <div className="min-w-0 px-4 py-[18px] text-sm leading-[1.65]" style={{ color: secondary }}>
                      <h3 className="mb-[5px] text-sm font-extrabold leading-snug" style={{ color: primaryDark }}>{row.remember?.title ?? ''}</h3>
                      <SafeHtml as="p" html={row.remember?.description ?? ''} className="font-medium [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {quickTips.length > 0 && (
          <section className="my-8 w-full">
            <div className="mb-[14px] flex items-center gap-3">
              <Lightbulb className="h-[23px] w-[23px]" style={{ color: primary }} />
              <h2 className="text-2xl font-extrabold leading-snug" style={{ color: secondary }}>Quick Tips</h2>
            </div>
            <div className="w-full rounded-[10px] border border-[#d2dcf0] bg-[#f4f7ff] dark:bg-slate-800 px-4 py-3 shadow-[0_4px_16px_rgba(11,27,61,0.05)]">
              {quickTips.map((tip, index) => (
                <div key={index} className="grid min-h-[42px] grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 border-b border-[#d2dcf0]/75 dark:border-slate-700 py-2 text-sm font-medium leading-[1.65] last:border-b-0" style={{ color: secondary }}>
                  <span className="mt-px flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#124fd6] text-white">
                    <Check className="h-3.5 w-3.5 stroke-[4]" />
                  </span>
                  <SafeHtml as="span" html={tip.text || ''} className="[&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" />
                </div>
              ))}
            </div>
          </section>
        )}

        {payload.finalTip && (
          <CalloutBanner
            icon={Star}
            tone="info"
            theme={{ primary, secondary, primaryDark }}
            className="mt-5"
          >
            <p className="flex flex-wrap items-baseline gap-2 text-[15px] font-medium leading-[1.65]" style={{ color: secondary }}>
              <strong className="font-extrabold">{payload.finalTip.title}</strong>
              <span>{payload.finalTip.text}</span>
            </p>
          </CalloutBanner>
        )}
      </BlockShell>
    );
  }

  // Legacy fallback: simple bullet point card
  const title = content?.title || content?.page?.title;
  const points: string[] = Array.isArray(content?.points)
    ? content.points
    : Array.isArray(content?.summary)
    ? content.summary.map((item: any) => item?.text || String(item)).filter(Boolean)
    : [];

  return (
    <section
      id={blockId}
      aria-label={title || 'Summary'}
      className={`my-4 p-5 rounded-lg border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm ${className}`}
      data-block-id={blockId}
      data-block-type={blockType}
      data-block-version={blockVersion}
    >
      <div className="flex items-center gap-2 mb-3 font-bold text-base text-indigo-950 dark:text-indigo-200">
        <span>📌</span>
        <h3>{title || 'Key Takeaways & Summary'}</h3>
      </div>

      <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
        {points.map((point, index) => (
          <li key={index} className="flex items-start gap-2">
            <span className="text-indigo-500 font-bold select-none">•</span>
            <span className="flex-1">{point}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
