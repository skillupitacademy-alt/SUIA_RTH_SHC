import React from 'react';
import { BookOpen, Check, FileText, Lightbulb, Star, Table2 } from 'lucide-react';
import type { ISummaryBlock, BlockComponentProps } from '../types';
import type { TutorialSummaryPayload } from '@quiz/types';
import { SafeHtml } from '../../SafeHtml';
import { BlockShell, BlockHeader, CalloutBanner, CardSurface, getStepBrandColor } from '../primitives';
import { DEFAULT_THEME, getThemeColor, withAlpha } from '../theme-utils';

interface LegacySummaryContent {
  title?: string;
  badge?: string;
  introduction?: string;
  points?: Array<string | { text?: string }>;
}

/**
 * Universal Summary Block (S1) - Canonical Locked UBA Renderer
 * 
 * Single unified renderer for all Summary blocks across all brands (SUIA, RTH, etc.)
 * Normalizes rich payloads and legacy payloads into a unified UBA component hierarchy:
 * BlockShell -> BlockHeader (Hero title) -> Summary Checklist Cards -> Revision Table -> Quick Tips -> Final Tip (CalloutBanner).
 */
export function SummaryBlock({ block, className = '', theme, runtimeContext }: BlockComponentProps<ISummaryBlock>) {
  const activeTheme = theme ?? DEFAULT_THEME;
  const primary = activeTheme.primary;
  const secondary = activeTheme.secondary;
  const primaryDark = activeTheme.primaryDark || primary;

  const content = (block.content || {}) as TutorialSummaryPayload & LegacySummaryContent;

  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'summary';
  const blockVersion = runtimeContext?.blockVersion ?? ('version' in block && typeof (block as { version?: string }).version === 'string' ? (block as { version: string }).version : 'S1');

  // Unified data normalization
  const page = content.page ?? {
    title: content.title || 'Revision Summary',
    badge: content.badge || 'REVISION & SUMMARY',
    introduction: content.introduction || '',
  };

  const rawSummary = Array.isArray(content.summary) ? content.summary : [];
  const rawPoints = Array.isArray(content.points) ? content.points : [];

  const summaryItems: Array<{ text: string }> = rawSummary.length > 0
    ? rawSummary.map((item) => (typeof item === 'string' ? { text: item } : item))
    : rawPoints.map((pt) => ({ text: typeof pt === 'string' ? pt : String(pt?.text || pt) }));

  const columns = Array.isArray(content.revisionTable?.columns) ? content.revisionTable!.columns : [];
  const rows = Array.isArray(content.revisionTable?.rows) ? content.revisionTable!.rows : [];
  const quickTips = Array.isArray(content.quickTips) ? content.quickTips : [];
  const finalTip = content.finalTip;

  const borderColor = getThemeColor(activeTheme, 'slate', 200);
  const codeBgColor = getThemeColor(activeTheme, 'slate', 100);

  return (
    <BlockShell
      id={blockId}
      className={className}
      theme={activeTheme}
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
        theme={activeTheme}
        className="mb-7"
      />

      {summaryItems.length > 0 && (
        <section className="my-8 w-full">
          <div className="mb-[14px] flex items-center gap-3">
            <FileText className="h-[23px] w-[23px]" style={{ color: primary }} />
            <h2 className="text-2xl font-extrabold leading-snug" style={{ color: secondary }}>Summary</h2>
          </div>
          <CardSurface
            theme={activeTheme}
            elevation="subtle"
            hoverable={false}
            className="w-full overflow-hidden p-0"
            style={{ borderColor: withAlpha(primary, '66') }}
          >
            {summaryItems.map((item, index: number) => {
              const bulletColor = getStepBrandColor(activeTheme, index + 1);
              return (
                <div
                  key={index}
                  className="grid min-h-[58px] grid-cols-[42px_minmax(0,1fr)] items-center border-b px-4 py-2.5 last:border-b-0 dark:border-slate-700"
                  style={{ borderColor: withAlpha(primary, '33') }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white shadow-xs border border-white/20 forced-colors:!border-2 forced-colors:!border-[ButtonText]"
                    style={{ backgroundColor: bulletColor }}
                  >
                    <Check className="h-3 w-3 stroke-[4]" />
                  </span>
                <SafeHtml
                  as="div"
                  html={item.text || ''}
                  className="text-[15px] font-medium leading-[1.65] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold"
                  style={{ color: secondary }}
                />
                </div>
              );
            })}
          </CardSurface>
        </section>
      )}

      {columns.length > 0 && rows.length > 0 && (
        <section className="my-8 w-full">
          <div className="mb-[14px] flex items-center gap-3">
            <Table2 className="h-[23px] w-[23px]" style={{ color: primary }} />
            <h2 className="text-2xl font-extrabold leading-snug" style={{ color: secondary }}>Revision Table</h2>
          </div>
          <CardSurface
            theme={activeTheme}
            elevation="subtle"
            hoverable={false}
            className="w-full overflow-hidden p-0"
            style={{ borderColor }}
          >
            <div className="bg-white dark:bg-slate-800 lg:hidden">
              {rows.map((row, index: number) => {
                return (
                  <article key={index} className="border-b p-4 last:border-b-0" style={{ borderColor }}>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm" style={{ borderColor: primary, backgroundColor: withAlpha(primary, '0d'), color: primary }}>
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <strong className="min-w-0 break-words text-[15px] font-extrabold leading-snug text-slate-900 dark:text-slate-100">{row.concept?.name ?? ''}</strong>
                    </div>
                    <dl className="space-y-3">
                      <div className="min-w-0">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{columns[1]?.title ?? 'Key point'}</dt>
                        <dd className="mt-1 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300"><strong>{row.keyPoint?.title ?? '—'}</strong>{row.keyPoint?.description && <SafeHtml as="span" html={` ${row.keyPoint.description}`} />}{row.keyPoint?.code && <code className="mt-2 block max-w-full whitespace-pre-wrap break-words rounded bg-slate-100 px-2 py-1 font-mono text-[13px] font-bold dark:bg-slate-900" style={{ color: primaryDark }}>{row.keyPoint.code}</code>}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{columns[2]?.title ?? 'Example'}</dt>
                        <dd className="mt-1 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">{row.example?.code ? <code className="block max-w-full whitespace-pre-wrap break-words rounded bg-slate-100 px-2 py-1 font-mono text-[13px] font-bold dark:bg-slate-900" style={{ color: primaryDark }}>{row.example.code}</code> : '—'}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{columns[3]?.title ?? 'Remember'}</dt>
                        <dd className="mt-1 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300"><strong>{row.remember?.title ?? '—'}</strong>{row.remember?.description && <SafeHtml as="span" html={` ${row.remember.description}`} />}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
            <div className="hidden overflow-hidden bg-white dark:bg-slate-800 lg:block">
              <div className="grid min-h-[62px] grid-cols-[1.05fr_2fr_1.1fr_1.55fr] text-white" style={{ backgroundColor: secondary }}>
                {columns.slice(0, 4).map((column) => (
                  <div key={column.id} className="flex min-w-0 items-center gap-2.5 border-r border-white/20 px-4 py-3 text-[15px] font-bold leading-snug last:border-r-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: primary }}><Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /></span>
                    <span className="break-words">{column.title}</span>
                  </div>
                ))}
              </div>
              {rows.map((row, index: number) => (
                <div key={index} className="grid min-h-[105px] grid-cols-[1.05fr_2fr_1.1fr_1.55fr] border-b bg-white last:border-b-0 dark:bg-slate-800" style={{ borderColor }}>
                  <div className="flex min-w-0 items-center gap-3 border-r px-4 py-[18px]" style={{ borderColor }}><strong className="break-words text-[15px] font-extrabold leading-snug text-slate-900 dark:text-slate-100">{row.concept?.name ?? ''}</strong></div>
                  <div className="min-w-0 border-r px-4 py-[18px] text-sm leading-[1.65]" style={{ borderColor }}><h3 className="mb-[5px] break-words text-sm font-extrabold leading-snug text-slate-900 dark:text-slate-100">{row.keyPoint?.title ?? ''}</h3><SafeHtml as="p" html={row.keyPoint?.description ?? ''} className="break-words font-medium text-slate-700 dark:text-slate-300" />{row.keyPoint?.code && <code className="mt-2 inline-block max-w-full whitespace-pre-wrap break-words rounded px-2 py-1 font-mono text-[13px] font-bold dark:bg-slate-900" style={{ backgroundColor: codeBgColor, color: primaryDark }}>{row.keyPoint.code}</code>}</div>
                  <div className="flex min-w-0 items-center border-r px-4 py-[18px]" style={{ borderColor }}>{row.example?.code && <code className="inline-block max-w-full whitespace-pre-wrap break-words rounded-md border px-[11px] py-[7px] font-mono text-[13px] font-bold leading-normal dark:bg-slate-900" style={{ backgroundColor: codeBgColor, borderColor, color: primary }}>{row.example.code}</code>}</div>
                  <div className="min-w-0 px-4 py-[18px] text-sm leading-[1.65] text-slate-700 dark:text-slate-300"><h3 className="mb-[5px] break-words text-sm font-extrabold leading-snug" style={{ color: primaryDark }}>{row.remember?.title ?? ''}</h3><SafeHtml as="p" html={row.remember?.description ?? ''} className="break-words font-medium [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" /></div>
                </div>
              ))}
            </div>
          </CardSurface>
        </section>
      )}

      {quickTips.length > 0 && (
        <section className="my-8 w-full">
          <div className="mb-[14px] flex items-center gap-3">
            <Lightbulb className="h-[23px] w-[23px]" style={{ color: primary }} />
            <h2 className="text-2xl font-extrabold leading-snug" style={{ color: secondary }}>Quick Tips</h2>
          </div>
          <CardSurface
            theme={activeTheme}
            elevation="subtle"
            hoverable={false}
            className="w-full px-4 py-3"
            style={{ backgroundColor: withAlpha(primary, '08'), borderColor: withAlpha(primary, '25') }}
          >
            {quickTips.map((tip, index: number) => {
              const tipColor = getStepBrandColor(activeTheme, index + 1);
              return (
                <div
                  key={index}
                  className="grid min-h-[42px] grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 border-b py-2 text-sm font-medium leading-[1.65] last:border-b-0"
                  style={{ borderColor: withAlpha(primary, '20'), color: secondary }}
                >
                  <span
                    className="mt-px flex h-[25px] w-[25px] items-center justify-center rounded-full text-white shadow-xs border border-white/20 forced-colors:!border-2 forced-colors:!border-[ButtonText]"
                    style={{ backgroundColor: tipColor }}
                  >
                    <Check className="h-3.5 w-3.5 stroke-[4]" />
                  </span>
                <SafeHtml as="span" html={tip.text || ''} className="[&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" />
                </div>
              );
            })}
          </CardSurface>
        </section>
      )}

      {finalTip && (
        <CalloutBanner
          icon={Star}
          tone="info"
          theme={activeTheme}
          className="mt-5"
        >
          <p className="flex flex-wrap items-baseline gap-2 text-[15px] font-medium leading-[1.65]" style={{ color: secondary }}>
            <strong className="font-extrabold">{finalTip.title}</strong>
            <span>{finalTip.text}</span>
          </p>
        </CalloutBanner>
      )}
    </BlockShell>
  );
}
