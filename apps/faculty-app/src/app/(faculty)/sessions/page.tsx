import { headers } from 'next/headers';
import Link from 'next/link';

import { SessionCreateForm } from '@/components/session-create-form';
import { listFacultyBatches, listFacultyUpcomingSessions, listFacultySessionRequests } from '@/lib/faculty-live-data';

export default async function SessionsPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const [sessions, requests, batches] =
    userId === null || userId.length === 0
      ? [[], [], []]
      : await Promise.all([listFacultyUpcomingSessions(userId), listFacultySessionRequests(userId), listFacultyBatches(userId)]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Sessions</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Upcoming classes and live requests</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This page surfaces the faculty schedule in one place so you can jump into the next class, then follow up on any pending live requests.
        </p>
      </div>

      <SessionCreateForm batches={batches} />

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Upcoming sessions</p>
          <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">{sessions.length}</p>
          <p className="mt-2 text-sm text-slate-600">Live classes and recently completed sessions assigned to you.</p>
        </article>
        <article className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">Pending requests</p>
          <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">{requests.length}</p>
          <p className="mt-2 text-sm text-slate-600">Doubt-clearing sessions waiting for your response.</p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Attendance entry</p>
          <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">1</p>
          <p className="mt-2 text-sm text-slate-600">Open a batch session from My Batches to mark attendance.</p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Teaching schedule</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Batch sessions</h3>
            </div>
            <Link href="/my-batches" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Open batches
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{session.batchName}</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{session.topic}</h4>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {session.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-600">{new Date(session.scheduledAt).toLocaleString()}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{session.studentCount} students</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-900"
                  >
                    Edit session
                  </Link>
                  <Link
                    href={`/my-batches/${session.batchId}/sessions/${session.id}/attendance`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
                  >
                    Attendance
                  </Link>
                </div>
              </div>
            ))}
            {sessions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No live batch sessions are scheduled yet.
              </div>
            ) : null}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Live requests</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Pending session requests</h3>
            </div>
            <Link href="/sessions/requests" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Manage all
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {requests.map((request) => (
              <div key={request.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">{request.studentName}</p>
                <p className="mt-1 text-base font-black tracking-tight text-slate-950">{request.subtopic}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{request.doubtText}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{request.batchName}</p>
              </div>
            ))}
            {requests.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No session requests waiting right now.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </section>
  );
}
