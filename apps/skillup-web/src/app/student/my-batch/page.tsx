import Link from 'next/link';

import { fetchSkillupApi } from '@/lib/skillup-api';
import { formatDateTime } from '@/lib/skillup-format';
import type { SkillupSession } from '@/lib/skillup-types';
import { SessionCalendar } from '@/components/SessionCalendar';

type MyBatchResponse = {
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

export default async function MyBatchPage() {
  const { batch, sessions } = await fetchSkillupApi<MyBatchResponse>('/api/student/my-batch');

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-kicker text-cyan-600">My batch</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">{batch.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Faculty, session schedule, and study materials are surfaced together in the same light shell.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Next session</p>
            <p className="mt-2 text-lg font-black text-slate-950 font-outfit">{formatDateTime(batch.nextSession)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Faculty</p>
            <p className="mt-3 text-lg font-black text-slate-950">{batch.faculty}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Students</p>
            <p className="mt-3 text-lg font-black text-slate-950">{batch.studentCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Current topic</p>
            <p className="mt-3 text-lg font-black text-slate-950">{batch.currentTopic}</p>
          </div>
        </div>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Session schedule</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">Completed and upcoming sessions</h3>
            </div>
            <Link href="/student/attendance" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Attendance
            </Link>
          </div>
          <div className="mt-6">
            <SessionCalendar sessions={sessions} />
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Materials</p>
          <div className="mt-6 space-y-3">
            {batch.materials.map((material) => (
              <div key={material} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                {material}
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
