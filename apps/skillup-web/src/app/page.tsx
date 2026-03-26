import type { Metadata } from 'next';
import Link from 'next/link';

import { skillupFacultyShowcase, skillupHeroStats, skillupPrograms } from '@/lib/skillup-demo-data';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'SkillUp IT Academy — Live Tech Training',
    description: 'Learn, practice, and progress through the SkillUp IT Academy student portal.',
    openGraph: {
      title: 'SkillUp IT Academy — Live Tech Training',
      description: 'Learn, practice, and progress through the SkillUp IT Academy student portal.',
    },
  };
}

export default function HomePage() {
  const gatewayLoginUrl = (() => {
    const raw = process.env.NEXT_PUBLIC_API_URL?.trim() ?? 'https://api.realtutorialhub.com/api';
    return `${raw.replace(/\/api\/?$/, '').replace(/\/+$/, '')}/login`;
  })();

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-8 lg:py-10">
      <section className="glass-morphism rounded-[2.5rem] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr] xl:items-end">
          <div className="space-y-5">
            <p className="eyebrow-label text-cyan-600">SkillUp IT Academy</p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
              Learn with expert instructors and move from training to placement.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              The student portal keeps courses, sessions, attendance, payments, and placement progress in one light shell that matches the rest of the platform.
            </p>
            <div className="flex flex-wrap gap-3">
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
                Explore programs
              </Link>
              <a
                href={gatewayLoginUrl}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                Sign In
              </a>
            </div>
          </div>

          <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            {skillupHeroStats.map((stat) => (
              <div key={stat.label} className="platform-card shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">{stat.label}</p>
                <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value}</p>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {skillupPrograms.map((program) => (
          <Link
            key={program.id}
            href={`/programs/${program.slug}`}
            className="glass-morphism rounded-[2.5rem] p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
          >
            <p className="eyebrow-label text-cyan-600">{program.duration}</p>
            <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">{program.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{program.summary}</p>
            <p className="mt-4 text-sm font-semibold text-slate-700">{program.audience}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="glass-morphism rounded-[2.5rem] p-6 shadow-sm">
          <p className="eyebrow-label text-slate-500">Why SkillUp</p>
          <div className="mt-5 space-y-4">
            {[
              'Structured batches with faculty support and session tracking',
              'Attendance, payments, and placement are visible in one student portal',
              'Cross-platform JWT lets students move between SkillUp and tutorial tools',
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="glass-morphism rounded-[2.5rem] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow-label text-slate-500">Faculty showcase</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Mentors who support the journey</h2>
            </div>
            <Link href="/register" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Apply now
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {skillupFacultyShowcase.map((mentor) => (
              <div key={mentor.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{mentor.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{mentor.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{mentor.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
