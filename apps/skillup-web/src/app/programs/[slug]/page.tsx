import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { fetchSkillupApi } from '@/lib/skillup-api';
import type { SkillupProgram } from '@/lib/skillup-types';

type ProgramsResponse = {
  programs: SkillupProgram[];
};

type ProgramPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { programs } = await fetchSkillupApi<ProgramsResponse>('/api/programs');
  return programs.map((program) => ({ slug: program.slug }));
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { programs } = await fetchSkillupApi<ProgramsResponse>('/api/programs');
  const program = programs.find((item) => item.slug === slug);

  if (!program) {
    return {
      title: 'Program not found',
    };
  }

  return {
    title: `${program.name} | SkillUp IT Academy`,
    description: program.summary,
    openGraph: {
      title: `${program.name} | SkillUp IT Academy`,
      description: program.summary,
      images: [`/programs/${program.slug}/opengraph-image`],
    },
  };
}

export default async function ProgramDetailPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const { programs } = await fetchSkillupApi<ProgramsResponse>('/api/programs');
  const program = programs.find((item) => item.slug === slug);

  if (!program) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <section className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Program details</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">{program.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{program.summary}</p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="surface-card rounded-[2.5rem] bg-white/80 p-6">
            <p className="section-kicker text-slate-500">Curriculum</p>
            <div className="mt-5 space-y-3">
              {[
                { title: 'Foundation', body: program.highlights[0] ?? program.description },
                { title: 'Build and ship', body: program.highlights[1] ?? program.summary },
                { title: 'Placement prep', body: program.highlights[2] ?? program.audience },
              ].map((section) => (
                <details key={section.title} className="group rounded-3xl border border-slate-200 bg-white px-4 py-3">
                  <summary className="cursor-pointer list-none text-sm font-bold text-slate-800">
                    <span className="flex items-center justify-between gap-3">
                      {section.title}
                      <span className="text-slate-400 transition group-open:rotate-45">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{section.body}</p>
                </details>
              ))}
            </div>
          </article>

          <article className="surface-card rounded-[2.5rem] bg-white/80 p-6">
            <p className="section-kicker text-slate-500">Program snapshot</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Duration</p>
                <p className="mt-2 text-lg font-black text-slate-950">{program.duration}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Audience</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{program.audience}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Description</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{program.description}</p>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/student"
            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            Open student dashboard
          </Link>
          <Link
            href="/programs"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Back to programs
          </Link>
        </div>
      </section>
    </main>
  );
}
