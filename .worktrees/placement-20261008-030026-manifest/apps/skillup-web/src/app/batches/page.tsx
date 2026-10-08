import Link from 'next/link';
import { CalendarDays, LayoutGrid, Users2 } from 'lucide-react';

import { fetchSkillupApi } from '@/lib/skillup-api';
import { formatDateTime } from '@/lib/skillup-format';
import type { SkillupSession } from '@/lib/skillup-types';

export const dynamic = 'force-dynamic';

type BatchesResponse = {
  batch: {
    name: string;
    faculty: string;
    currentTopic: string;
    nextSession: string;
    studentCount: number;
    schedule: Array<{ day: string; time: string; topic: string; mode: string }>;
    materials: string[];
  };
  sessions: SkillupSession[];
};

export default async function BatchesPage() {
  const { batch, sessions } = await fetchSkillupApi<BatchesResponse>('/api/batches');

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Batches</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Protected batch workspace</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The batch route is protected by the SkillUp proxy and keeps the learner schedule, faculty, and upcoming sessions together.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Batch summary</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Batch name</p>
              <p className="mt-2 text-lg font-black text-slate-950 font-outfit">{batch.name}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Faculty</p>
              <p className="mt-2 text-lg font-black text-slate-950">{batch.faculty}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Current topic</p>
              <p className="mt-2 text-lg font-black text-slate-950">{batch.currentTopic}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Learners', value: batch.studentCount.toString(), icon: Users2 },
              { label: 'Next class', value: formatDateTime(batch.nextSession), icon: CalendarDays },
              { label: 'Modules', value: batch.materials.length.toString(), icon: LayoutGrid },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <item.icon className="text-cyan-600" size={18} />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.3em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Schedule</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">Upcoming batch sessions</h3>
            </div>
            <Link href="/student/my-batch" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Student batch view
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {session.mode}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{formatDateTime(session.date)}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
