import { headers } from 'next/headers';
import Link from 'next/link';

import { listFacultyAttendanceOverview } from '@/lib/faculty-live-data';
import { getEffectiveUserId } from '@/lib/request-auth';

export default async function AttendancePage() {
  const requestHeaders = await headers();
  const userId = getEffectiveUserId(requestHeaders);
  const sessions = userId === null || userId.length === 0 ? [] : await listFacultyAttendanceOverview(userId);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Attendance</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Batch attendance overview</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Review recent batch sessions, check the present/absent counts, and open the mark sheet for any live class.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Sessions shown</p>
          <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">{sessions.length}</p>
          <p className="mt-2 text-sm text-slate-600">Recent sessions pulled from your assigned batches.</p>
        </article>
        <article className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">Marked present</p>
          <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">
            {sessions.reduce((sum, item) => sum + item.presentCount, 0)}
          </p>
          <p className="mt-2 text-sm text-slate-600">Attendance entries already recorded in the system.</p>
        </article>
        <article className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-rose-700">Marked absent</p>
          <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">
            {sessions.reduce((sum, item) => sum + item.absentCount, 0)}
          </p>
          <p className="mt-2 text-sm text-slate-600">Sessions where learners were marked absent.</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sessions.map((session) => (
          <article key={session.sessionId} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{session.batchName}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{session.sessionTopic}</h3>
              </div>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {session.studentCount} learners
              </span>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600">{new Date(session.sessionAt).toLocaleString()}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Present</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{session.presentCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Absent</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{session.absentCount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Status</p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-950">Live sheet</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/my-batches/${session.batchId}/sessions/${session.sessionId}/attendance`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
              >
                Open mark sheet
              </Link>
            </div>
          </article>
        ))}
        {sessions.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
            No attendance sessions are available yet.
          </div>
        ) : null}
      </section>
    </section>
  );
}
