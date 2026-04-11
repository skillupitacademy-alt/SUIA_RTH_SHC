import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Globe2,
  ListChecks,
  Settings2,
  Cpu,
} from 'lucide-react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { InstructionManualViewData } from '../../launchExamPageData';

interface InstructionManualProps {
  data: InstructionManualViewData;
}

const iconMap = {
  globe: Globe2,
  library: BookOpen,
  target: ListChecks,
  cpu: Cpu,
  sliders: Settings2,
  rocket: ClipboardList,
} as const;

export function InstructionManual({ data }: InstructionManualProps) {
  const brand = useBrand();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-8 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-sm"
                    style={{ backgroundColor: brand.primaryColor }}
                  >
                    {brand.brandMark}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-[11px] font-black uppercase tracking-[0.22em]"
                      style={{ color: brand.primaryColor }}
                    >
                      {data.eyebrow}
                    </p>
                    <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      {data.title}
                    </h1>
                  </div>
                </div>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                  {data.subtitle}. Review the six stages below before entering the assessment configuration flow for {brand.name}.
                </p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:gap-4 lg:justify-end">
                <Link
                  href="/dashboard"
                  aria-label="Return to dashboard"
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:px-4 sm:text-sm"
                  style={{ backgroundColor: brand.secondaryColor }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden xs:block">Back</span>
                </Link>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{data.journeyScopeLabel}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {data.journeyScopeValueFormat.replace('{count}', String(data.steps.length))}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{data.journeyScopeDescription}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="px-5 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.steps.map((step, index) => {
                const Icon = iconMap[step.iconName as keyof typeof iconMap] ?? Globe2;
                const isPrimaryStage = index === 0;
                return (
                  <article
                    key={step.id}
                    className="instruction-manual-card rounded-[1.75rem] bg-white p-5 shadow-sm transition-transform duration-300 hover:-translate-y-1"
                    style={{
                      animationDelay: `${index * 70}ms`,
                      boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.06)`,
                      border: isPrimaryStage ? `2px solid ${brand.primaryColor}` : '1px solid rgb(226 232 240)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                        style={{
                          backgroundColor: `rgba(${brand.primaryRgb}, 0.08)`,
                          borderColor: `rgba(${brand.primaryRgb}, 0.18)`,
                        }}
                      >
                        <Icon className="h-7 w-7" style={{ color: brand.primaryColor }} />
                      </div>
                      <div
                        className="inline-flex shrink-0 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]"
                        style={{
                          color: brand.primaryColorDark,
                          backgroundColor: `rgba(${brand.primaryRgb}, 0.1)`,
                        }}
                      >
                        {data.stageLabelPrefix} {index + 1}
                      </div>
                    </div>

                    <h2 className="mt-5 text-xl font-black tracking-tight text-slate-950">
                      {step.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">
              <div className="mx-auto flex max-w-3xl flex-col items-center">
                <div className="min-w-0">
                  <p
                    className="text-[11px] font-black uppercase tracking-[0.18em]"
                    style={{ color: brand.primaryColor }}
                  >
                    {data.roadmapLabel}
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    {data.roadmapTitle}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                    {data.roadmapDescription}
                  </p>
                </div>

                <Link
                  href="/launch-exam/configure"
                  className="mt-5 inline-flex items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold text-white shadow-sm transition-colors hover:opacity-95 sm:text-base"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  <span>{data.ctaLabel}</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      <style jsx>{`
        .instruction-manual-card {
          animation: manual-card-rise 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        @keyframes manual-card-rise {
          from {
            transform: translateY(20px);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
