import Link from 'next/link';
import { ArrowRight, BookOpenText, GraduationCap, LucideIcon, Sparkles } from 'lucide-react';

import type { BrandStartLearningOption, SharedBrandDefinition } from '@quiz/config/src/brands';

function sectionHeadingStyle() {
  return { fontFamily: "'Poppins', 'Outfit', system-ui, sans-serif" };
}

function bodyStyle() {
  return { fontFamily: "'Inter', system-ui, sans-serif" };
}

const optionIcons: Record<BrandStartLearningOption['target'], LucideIcon> = {
  exam: Sparkles,
  tutorial: BookOpenText,
};

export function StartLearningPage({
  backHref,
  brand,
}: {
  backHref: string;
  brand: SharedBrandDefinition;
}) {
  return (
    <main
      className="min-h-screen text-slate-950"
      style={{
        background: `
          radial-gradient(circle at top, ${brand.secondaryColor}18, transparent 28%),
          radial-gradient(circle at 18% 12%, ${brand.primaryColor}14, transparent 22%),
          linear-gradient(180deg, #ffffff 0%, #f7f8fc 100%)
        `,
      }}
    >
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-10 md:px-6 lg:py-12">
        <header className="flex items-center justify-between gap-4">
          <Link href={backHref} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-[0_14px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5">
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]" style={{ backgroundColor: brand.secondaryColor }}>
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-400">{brand.navLabel}</p>
              <p className="text-lg font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>{brand.brandName}</p>
            </div>
          </div>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10 lg:py-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.45em]" style={{ color: brand.primaryColor }}>
              Start Learning
            </p>
            <h1 className="mt-6 text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl" style={sectionHeadingStyle()}>
              {brand.startLearning.heading}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600" style={bodyStyle()}>
              {brand.startLearning.copy}
            </p>
          </div>

          <div className="mx-auto mt-14 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
            {brand.startLearning.options.map((option) => {
              const Icon = optionIcons[option.target];

              return (
                <a
                  key={option.target}
                  href={option.href}
                  className="group rounded-[2.75rem] border border-slate-200 bg-white/86 p-8 shadow-[0_26px_72px_rgba(15,23,42,0.10)] backdrop-blur-xl transition hover:-translate-y-1"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-white shadow-[0_16px_32px_rgba(15,23,42,0.14)]"
                    style={{ backgroundColor: option.target === 'exam' ? brand.primaryColor : brand.secondaryColor }}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <h2 className="mt-8 text-3xl font-black tracking-tight text-slate-950" style={sectionHeadingStyle()}>
                    {option.title}
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-600" style={bodyStyle()}>
                    {option.description}
                  </p>
                  <div className="mt-8 inline-flex items-center text-sm font-bold" style={{ color: brand.secondaryColor }}>
                    Continue to {option.title}
                    <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" />
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
