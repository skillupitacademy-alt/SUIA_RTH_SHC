import { BookOpen, Check, Code2, FileText, Lightbulb, Star, Table2 } from 'lucide-react';
import type { BrandTutorialTheme, TutorialSummaryPayload } from '@quiz/types';

interface TutorialSummaryContentProps {
  payload: TutorialSummaryPayload;
  theme: BrandTutorialTheme;
}

function html(value: string) {
  return { __html: value };
}

function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

export function TutorialSummaryContent({ payload, theme }: TutorialSummaryContentProps) {
  const page = payload.page ?? { title: 'Revision Summary', introduction: '' };
  const summaryItems = Array.isArray(payload.summary) ? payload.summary : [];
  const columns = Array.isArray(payload.revisionTable?.columns) ? payload.revisionTable.columns : [];
  const rows = Array.isArray(payload.revisionTable?.rows) ? payload.revisionTable.rows : [];
  const quickTips = Array.isArray(payload.quickTips) ? payload.quickTips : [];

  return (
    <article className="w-full bg-white px-[5%] py-10 text-[#0b1b3d]">
      <header className="mb-7 w-full">
        <div className="mb-[14px] inline-flex w-fit items-center gap-2.5 rounded px-[9px] py-[5px] text-base font-extrabold leading-snug" style={{ color: theme.primary, backgroundColor: withAlpha(theme.primary, '14') }}>
          <BookOpen className="h-[30px] w-[30px]" />
          <span>{page.badge || 'REVISION & SUMMARY'}</span>
        </div>
        <h1 className="text-[clamp(38px,6.9vw,55px)] font-extrabold leading-[1.08]" style={{ color: theme.secondary }}>
          {page.title || 'Revision Summary'}
        </h1>
        <div className="mb-[17px] mt-4 h-1 w-12 rounded-full" style={{ backgroundColor: theme.primary }} />
        {page.introduction && <p className="text-lg font-medium leading-[1.7]" style={{ color: theme.secondary }}>{page.introduction}</p>}
      </header>

      {summaryItems.length > 0 && (
        <section className="my-8 w-full">
          <div className="mb-[14px] flex items-center gap-3">
            <FileText className="h-[23px] w-[23px]" style={{ color: theme.primary }} />
            <h2 className="text-2xl font-extrabold leading-snug" style={{ color: theme.secondary }}>Summary</h2>
          </div>
          <div className="w-full overflow-hidden rounded-[10px] border bg-white shadow-[0_4px_16px_rgba(11,27,61,0.05)]" style={{ borderColor: withAlpha(theme.primary, '66') }}>
            {summaryItems.map((item, index) => (
              <div key={index} className="grid min-h-[58px] grid-cols-[42px_minmax(0,1fr)] items-center border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: withAlpha(theme.primary, '33') }}>
                <span className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ backgroundColor: theme.primary }}>
                  <Check className="h-3 w-3 stroke-[4]" />
                </span>
                <div className="text-[15px] font-medium leading-[1.65] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" style={{ color: theme.secondary }} dangerouslySetInnerHTML={html(item.text || '')} />
              </div>
            ))}
          </div>
        </section>
      )}

      {columns.length > 0 && rows.length > 0 && (
        <section className="my-8 w-full">
          <div className="mb-[14px] flex items-center gap-3">
            <Table2 className="h-[23px] w-[23px]" style={{ color: theme.primary }} />
            <h2 className="text-2xl font-extrabold leading-snug" style={{ color: theme.secondary }}>Revision Table</h2>
          </div>
          <div className="w-full overflow-x-auto rounded-[10px] border bg-white shadow-[0_4px_16px_rgba(11,27,61,0.05)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ borderColor: '#d9e0ea' }}>
            <div className="min-w-[920px] bg-white">
              <div className="grid min-h-[62px] grid-cols-[1.05fr_2fr_1.1fr_1.55fr] bg-[#0b1b3d] text-white">
                {columns.slice(0, 4).map((column) => (
                  <div key={column.id} className="flex items-center gap-2.5 border-r border-white/20 px-4 py-3 text-[15px] font-bold leading-snug last:border-r-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white" style={{ backgroundColor: theme.primary }}>
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                    <span>{column.title}</span>
                  </div>
                ))}
              </div>

              {rows.map((row, index) => (
                <div key={index} className="grid min-h-[105px] grid-cols-[1.05fr_2fr_1.1fr_1.55fr] border-b border-[#e5eaf1] bg-white last:border-b-0">
                  <div className="flex min-w-0 items-center gap-3 border-r border-[#e5eaf1] px-4 py-[18px]">
                    <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border-2 text-sm" style={{ borderColor: theme.primary, backgroundColor: withAlpha(theme.primary, '0d'), color: theme.primary }}>
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <strong className="text-[15px] font-extrabold leading-snug" style={{ color: theme.secondary }}>{row.concept?.name ?? ''}</strong>
                  </div>
                  <div className="min-w-0 border-r border-[#e5eaf1] px-4 py-[18px] text-sm leading-[1.65]" style={{ color: theme.secondary }}>
                    <h3 className="mb-[5px] text-sm font-extrabold leading-snug">{row.keyPoint?.title ?? ''}</h3>
                    <p className="font-medium" dangerouslySetInnerHTML={html(row.keyPoint?.description ?? '')} />
                    {row.keyPoint?.code && <code className="mt-2 inline-block rounded bg-[#f7f9fc] px-2 py-1 font-mono text-[13px] font-bold" style={{ color: theme.primaryDark }}>{row.keyPoint.code}</code>}
                  </div>
                  <div className="flex min-w-0 items-center border-r border-[#e5eaf1] px-4 py-[18px]">
                    {row.example?.code && <code className="inline-block max-w-full whitespace-pre-wrap rounded-md border border-[#d9e0ea] bg-[#f7f9fc] px-[11px] py-[7px] font-mono text-[13px] font-bold leading-normal" style={{ color: '#124fd6' }}>{row.example.code}</code>}
                  </div>
                  <div className="min-w-0 px-4 py-[18px] text-sm leading-[1.65]" style={{ color: theme.secondary }}>
                    <h3 className="mb-[5px] text-sm font-extrabold leading-snug" style={{ color: theme.primaryDark }}>{row.remember?.title ?? ''}</h3>
                    <p className="font-medium [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" dangerouslySetInnerHTML={html(row.remember?.description ?? '')} />
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
            <Lightbulb className="h-[23px] w-[23px]" style={{ color: theme.primary }} />
            <h2 className="text-2xl font-extrabold leading-snug" style={{ color: theme.secondary }}>Quick Tips</h2>
          </div>
          <div className="w-full rounded-[10px] border border-[#d2dcf0] bg-[#f4f7ff] px-4 py-3 shadow-[0_4px_16px_rgba(11,27,61,0.05)]">
            {quickTips.map((tip, index) => (
              <div key={index} className="grid min-h-[42px] grid-cols-[28px_minmax(0,1fr)] items-start gap-2.5 border-b border-[#d2dcf0]/75 py-2 text-sm font-medium leading-[1.65] last:border-b-0" style={{ color: theme.secondary }}>
                <span className="mt-px flex h-[25px] w-[25px] items-center justify-center rounded-full bg-[#124fd6] text-white">
                  <Check className="h-3.5 w-3.5 stroke-[4]" />
                </span>
                <span className="[&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" dangerouslySetInnerHTML={html(tip.text || '')} />
              </div>
            ))}
          </div>
        </section>
      )}

      {payload.finalTip && (
        <section className="mt-5 flex w-full items-center gap-3.5 rounded-[10px] border border-[#d2dcf0] bg-[#f4f7ff] px-5 py-[18px] shadow-[0_4px_16px_rgba(11,27,61,0.05)]">
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#124fd6] text-white">
            <Star className="h-3.5 w-3.5 fill-current" />
          </span>
          <p className="flex flex-wrap items-baseline gap-2 text-[15px] font-medium leading-[1.65]" style={{ color: theme.secondary }}>
            <strong className="font-extrabold">{payload.finalTip.title}</strong>
            <span>{payload.finalTip.text}</span>
          </p>
        </section>
      )}
    </article>
  );
}
