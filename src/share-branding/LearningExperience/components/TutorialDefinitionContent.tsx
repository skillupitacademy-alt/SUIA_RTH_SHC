import type { BrandTutorialTheme, TutorialDefinitionPayload } from '@quiz/types';

interface TutorialDefinitionContentProps {
  payload: TutorialDefinitionPayload;
  theme: BrandTutorialTheme;
}

export function TutorialDefinitionContent({ payload, theme }: TutorialDefinitionContentProps) {
  const page = payload.page;

  return (
    <section className="rounded-xl border border-[#e4eaf2] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.primary }}>
          {page.category ?? 'Definition'}
        </p>
        <h1 className="mt-2 text-3xl font-black leading-tight text-[#071f63]">{page.title}</h1>
        <p className="mt-3 text-base leading-7 text-[#38527a]">{page.intro}</p>
      </div>

      <div className="rounded-lg border-l-4 bg-[#f8fafc] p-5" style={{ borderLeftColor: theme.primary }}>
        <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-[#60738f]">Definition</h2>
        <p className="mt-2 text-lg font-semibold leading-8 text-[#071f63]">{page.definition}</p>
      </div>

      {page.explanation?.length > 0 && (
        <div className="mt-6 space-y-3">
          {page.explanation.map((item, index) => (
            <p key={index} className="text-[15px] leading-7 text-[#2b4367]">
              {item}
            </p>
          ))}
        </div>
      )}

      {page.example && (
        <div className="mt-6 overflow-hidden rounded-lg border border-[#dfe7f1] bg-[#071024]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{page.example.language}</span>
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-[#e6edf7]"><code>{page.example.code}</code></pre>
        </div>
      )}

      {page.characteristics && page.characteristics.length > 0 && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {page.characteristics.map((item) => (
            <div key={item.title} className="rounded-lg border border-[#e4eaf2] bg-[#fbfcfe] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: theme.primary }}>
                  {item.icon ?? '-'}
                </span>
                <div>
                  <h3 className="font-bold text-[#071f63]">{item.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[#476180]">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {page.takeaway && (
        <div className="mt-6 rounded-lg px-5 py-4 text-sm font-semibold leading-6 text-[#071f63]" style={{ backgroundColor: theme.activeBackground }}>
          {page.takeaway}
        </div>
      )}
    </section>
  );
}
