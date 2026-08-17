import type { BrandTutorialTheme, TutorialCodePayload } from '@quiz/types';

interface TutorialCodeContentProps {
  payload: TutorialCodePayload;
  theme: BrandTutorialTheme;
}

function html(value: string) {
  return { __html: value };
}

export function TutorialCodeContent({ payload, theme }: TutorialCodeContentProps) {
  return (
    <section className="rounded-xl border border-[#e4eaf2] bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: theme.primary }}>
          {payload.page.type}
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-[#071f63]">{payload.page.title}</h2>
        <p className="mt-3 text-[15px] leading-7 text-[#38527a]">{payload.page.introduction}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#dfe7f1] bg-[#071024]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">{payload.code.language}</span>
        </div>
        <pre className="overflow-x-auto p-4 text-sm leading-6 text-[#e6edf7]"><code>{payload.code.source}</code></pre>
      </div>

      {payload.explanation?.steps?.length ? (
        <div className="mt-6 space-y-3">
          {payload.explanation.steps.map((step) => (
            <div key={step.number} className="grid gap-3 rounded-lg border border-[#e4eaf2] bg-[#fbfcfe] p-4 sm:grid-cols-[44px_1fr]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black text-white" style={{ backgroundColor: theme.primary }}>
                {step.number}
              </span>
              <div>
                <code className="rounded bg-[#eef3fa] px-2 py-1 text-sm font-bold text-[#071f63]">{step.code}</code>
                <p className="mt-2 text-sm leading-6 text-[#425c7d]" dangerouslySetInnerHTML={html(step.description)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {payload.output && (
        <div className="mt-6 rounded-lg border border-[#dfe7f1] bg-[#f8fafc] p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#60738f]">Output</h3>
          <pre className="mt-3 overflow-x-auto rounded-md bg-white p-4 text-sm leading-6 text-[#071f63]">{payload.output.value}</pre>
        </div>
      )}

      {payload.memoryModel && (
        <div className="mt-6 rounded-lg border border-[#dfe7f1] bg-[#fbfcfe] p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-[#60738f]">Memory Model</h3>
          {payload.memoryModel.description && <p className="mt-2 text-sm leading-6 text-[#425c7d]">{payload.memoryModel.description}</p>}
          {payload.memoryModel.columns && payload.memoryModel.nodes ? (
            <div className="mt-4 overflow-x-auto">
              <div
                className="grid min-w-[680px] gap-3"
                style={{ gridTemplateColumns: payload.memoryModel.columns.map((column) => column.width ?? '1fr').join(' ') }}
              >
                {payload.memoryModel.columns.map((column) => (
                  <div key={column.id} className="rounded-md bg-[#eef3fa] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#071f63]">
                    {column.title}
                  </div>
                ))}
                {payload.memoryModel.nodes
                  .slice()
                  .sort((a, b) => a.row - b.row || a.column.localeCompare(b.column))
                  .map((node) => (
                    <div
                      key={node.id}
                      className="rounded-lg border px-3 py-3 text-sm font-bold text-[#071f63]"
                      style={{
                        borderColor: node.variant === 'result' ? theme.primary : '#d9e3ef',
                        backgroundColor: node.variant === 'result' ? theme.activeBackground : '#ffffff',
                        fontFamily: node.monospace ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' : undefined,
                      }}
                    >
                      {node.label}
                    </div>
                  ))}
              </div>
            </div>
          ) : null}
          {payload.memoryModel.note && <p className="mt-3 text-xs font-semibold text-[#60738f]">{payload.memoryModel.note}</p>}
        </div>
      )}

      {payload.takeaway?.items?.length ? (
        <div className="mt-6 rounded-lg px-5 py-4" style={{ backgroundColor: theme.activeBackground }}>
          <h3 className="text-sm font-bold text-[#071f63]">Takeaway</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-[#2d4567]">
            {payload.takeaway.items.map((item, index) => (
              <li key={index} dangerouslySetInnerHTML={html(item)} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
