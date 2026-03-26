import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { listFacultyBatches, listFacultyUpcomingSessions } from '@/lib/faculty-live-data';

type BatchPageProps = {
  params: Promise<{ batchId: string }>;
};

export default async function BatchDetailPage({ params }: BatchPageProps) {
  const { batchId } = await params;
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');

  if (userId === null || userId.length === 0) {
    notFound();
  }

  const [batches, sessions] = await Promise.all([listFacultyBatches(userId), listFacultyUpcomingSessions(userId)]);
  const batch = batches.find((item) => item.id === batchId);

  if (batch === undefined) {
    notFound();
  }

  const batchSessions = sessions.filter((session) => session.batchId === batchId);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">My batches</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{batch.name}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          {batch.track} cohort with {batch.studentCount} students. Review the upcoming sessions and jump into attendance or session edit from here.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{batch.progress}% complete</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{batch.studentCount} students</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(batch.nextSessionAt).toLocaleString()}</span>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Next session</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{batch.nextSessionTopic}</h3>
          <p className="mt-3 text-sm text-slate-600">This is the next scheduled class on the faculty roster.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/sessions/${batch.nextSessionId}`}
              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Edit session
            </Link>
            <Link
              href={`/my-batches/${batch.id}/sessions/${batch.nextSessionId}/attendance`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
            >
              Attendance sheet
            </Link>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Session list</p>
          <div className="mt-4 space-y-3">
            {batchSessions.map((session) => (
              <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{new Date(session.scheduledAt).toLocaleString()}</p>
                    <h4 className="mt-1 text-lg font-black tracking-tight text-slate-950">{session.topic}</h4>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {session.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{session.durationMinutes} minutes</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/my-batches/${batch.id}/sessions/${session.id}`}
                    className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-100 hover:text-cyan-900"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/my-batches/${batch.id}/sessions/${session.id}/attendance`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    Attendance
                  </Link>
                </div>
              </div>
            ))}
            {batchSessions.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                No sessions are available for this batch yet.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </section>
  );
}
