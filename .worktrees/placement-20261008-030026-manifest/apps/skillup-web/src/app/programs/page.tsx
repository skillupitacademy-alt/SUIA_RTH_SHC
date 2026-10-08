import type { Metadata } from 'next';
import Link from 'next/link';

import { fetchSkillupApi } from '@/lib/skillup-api';
import type { SkillupProgram } from '@/lib/skillup-types';

type ProgramsResponse = {
  programs: SkillupProgram[];
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Programs | SkillUp IT Academy',
    description: 'Explore the active SkillUp IT Academy programs.',
    openGraph: {
      title: 'Programs | SkillUp IT Academy',
      description: 'Explore the active SkillUp IT Academy programs.',
    },
  };
}

export default async function ProgramsPage() {
  const { programs } = await fetchSkillupApi<ProgramsResponse>('/api/programs');

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <section className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker text-cyan-600">Programs</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Active learning tracks</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Course catalog cards follow the same light layout as the rest of the platform while keeping the content easy to scan.
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
            Back to home
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.slug}`}
              className="surface-card transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-sm rounded-[2.5rem] p-6"
            >
              <p className="section-kicker text-slate-500">{program.duration}</p>
              <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">{program.name}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{program.summary}</p>
              <p className="mt-4 text-sm font-semibold text-slate-700">{program.audience}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
