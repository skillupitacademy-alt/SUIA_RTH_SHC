import Link from 'next/link';
import { BadgeCheck, BookOpenText, CalendarDays, Users2 } from 'lucide-react';

import { fetchSkillupApi } from '@/lib/skillup-api';
import type { SkillupFacultyMember } from '@/lib/skillup-types';

const facultyStats = [
  { label: 'Active mentors', value: '38', icon: Users2 },
  { label: 'Batch reviews', value: '124', icon: BookOpenText },
  { label: 'Upcoming sessions', value: '18', icon: CalendarDays },
  { label: 'Quality score', value: '96%', icon: BadgeCheck },
];

type FacultyResponse = {
  faculty: SkillupFacultyMember[];
  heroStats: Array<{ label: string; value: string }>;
};

export default async function FacultyPage() {
  const { faculty, heroStats } = await fetchSkillupApi<FacultyResponse>('/api/faculty');

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Faculty</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Mentor workspace and batch oversight</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The faculty route is protected by the SkillUp proxy and gives mentors a dedicated space for batch progress and learner guidance.
        </p>
      </article>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {heroStats.map((stat, index) => {
          const Icon = facultyStats[index]?.icon ?? BadgeCheck;

          return (
            <article key={stat.label} className="surface-card rounded-3xl p-5">
              <Icon className="text-cyan-600" size={18} />
              <p className="mt-3 text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-slate-950 font-outfit">{stat.value}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Mentors</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">Current faculty showcase</h3>
            </div>
            <Link href="/batches" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Batch overview
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {faculty.map((mentor) => (
              <div key={mentor.name} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-950">{mentor.name}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{mentor.title}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{mentor.description}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Faculty actions</p>
          <div className="mt-6 space-y-4">
            {[
              'Review batch attendance and learner progress in one place',
              'Share practice tasks and module notes inside the same brand shell',
              'Coordinate placement readiness before handing learners to the next stage',
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
