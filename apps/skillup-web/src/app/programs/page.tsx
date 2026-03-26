import type { Metadata } from 'next';
import Link from 'next/link';

import { skillupPrograms } from '@/lib/skillup-demo-data';

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

export default function ProgramsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <section className="glass-morphism rounded-[2.5rem] p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow-label text-cyan-600">Programs</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Active learning tracks</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Course catalog cards follow the same light layout as the rest of the platform while keeping the content easy to scan.
            </p>
          </div>
          <Link href="/" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
            Back to home
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {skillupPrograms.map((program) => (
            <Link
              key={program.id}
              href={`/programs/${program.slug}`}
              className="platform-card transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white hover:shadow-sm"
            >
              <p className="eyebrow-label text-slate-500">{program.duration}</p>
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
