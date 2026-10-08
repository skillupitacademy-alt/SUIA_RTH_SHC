import { headers } from 'next/headers';
import Link from 'next/link';

import { listFacultyBatches } from '@/lib/faculty-live-data';
import { getEffectiveUserId } from '@/lib/request-auth';

export default async function MyBatchesPage() {
  const requestHeaders = await headers();
  const userId = getEffectiveUserId(requestHeaders);
  const batches = userId === null || userId.length === 0 ? [] : await listFacultyBatches(userId);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">My batches</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Assigned cohorts and next sessions</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This list is intentionally compact and decision-oriented. Each card shows the batch identity, learner count, and the next session that needs faculty attention.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {batches.map((batch) => (
          <article key={batch.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{batch.track}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{batch.name}</h3>
              </div>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
                {batch.studentCount} students
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Next session</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{batch.nextSessionTopic}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">{new Date(batch.nextSessionAt).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Progress</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{batch.progress}%</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500" style={{ width: `${batch.progress}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Open the attendance sheet for the latest session or review this cohort before the next live class.</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/my-batches/${batch.id}`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
                >
                  Open batch
                </Link>
                <Link
                  href={`/my-batches/${batch.id}/sessions/${batch.nextSessionId}/attendance`}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
                >
                  Attendance
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
