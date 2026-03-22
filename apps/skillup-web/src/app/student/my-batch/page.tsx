import Link from 'next/link';

import { formatDateTime, studentBatchDetails, studentSessions } from '@/lib/skillup-demo-data';

export default function MyBatchPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">My batch</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{studentBatchDetails.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Faculty, session schedule, and study materials are surfaced together in the same light shell.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Next session</p>
            <p className="mt-2 text-lg font-black text-slate-950">{formatDateTime(studentBatchDetails.nextSession)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Faculty</p>
            <p className="mt-3 text-lg font-black text-slate-950">{studentBatchDetails.faculty}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Students</p>
            <p className="mt-3 text-lg font-black text-slate-950">{studentBatchDetails.studentCount}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Current topic</p>
            <p className="mt-3 text-lg font-black text-slate-950">{studentBatchDetails.currentTopic}</p>
          </div>
        </div>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Session schedule</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Completed and upcoming sessions</h3>
            </div>
            <Link href="/student/attendance" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Attendance
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {studentSessions.map((session) => (
              <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDateTime(session.date)} - {session.mode}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold text-slate-700">
                    {session.status}
                  </span>
                </div>
                {session.recording ? <p className="mt-3 text-sm text-cyan-700">Recording: {session.recording}</p> : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Materials</p>
          <div className="mt-6 space-y-3">
            {studentBatchDetails.materials.map((material) => (
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
