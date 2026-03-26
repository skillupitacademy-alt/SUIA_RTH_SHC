import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

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
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-10 px-6 py-8 lg:py-10">
      <section className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div className="space-y-5">
            <p className="section-kicker text-cyan-600">SkillUp IT Academy</p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl font-outfit">
              Learn with expert instructors and move from training to placement.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              The student portal keeps courses, sessions, attendance, payments, and placement progress in one light shell that matches the rest of the platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/student" className="inline-flex items-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600">
                Open student dashboard
                <ArrowRight className="ml-2" size={16} />
              </Link>
              <Link href="/programs" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
                Explore programs
              </Link>
              <Link href="/login" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
                Sign In
              </Link>
            </div>
          </div>

          <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="surface-card rounded-[2rem] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Secure portal</p>
                  <p className="mt-1 text-sm text-slate-600">HttpOnly cookie session flow</p>
                </div>
              </div>
            </div>
            {skillupHeroStats.map((stat) => (
              <div key={stat.label} className="surface-card rounded-[2rem] p-6">
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
            className="surface-card rounded-[2.5rem] p-6 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md"
          >
            <p className="section-kicker text-cyan-600">{program.duration}</p>
            <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">{program.name}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{program.summary}</p>
            <p className="mt-4 text-sm font-semibold text-slate-700">{program.audience}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="surface-card rounded-[2.5rem] p-6">
          <p className="section-kicker text-slate-500">Why SkillUp</p>
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

        <article className="surface-card rounded-[2.5rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Faculty showcase</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">Mentors who support the journey</h2>
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
