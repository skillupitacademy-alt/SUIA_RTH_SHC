import Link from 'next/link';

import { adminBatches } from '@/lib/admin-demo-data';

export default function BatchesPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Batches</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Batch planning, faculty assignment, and student rosters</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Create new cohorts, inspect upcoming sessions, and open the student roster for any live batch in the academy.
        </p>
        <div className="mt-5">
          <Link href="/batches/new" className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700">
            Create batch
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {adminBatches.map((batch) => (
          <article key={batch.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{batch.program}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{batch.name}</h3>
                <p className="mt-2 text-sm text-slate-600">Faculty: {batch.facultyName}</p>
              </div>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                {batch.studentCount} / 32
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Next session</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{batch.sessionTopic}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">{new Date(batch.nextSessionAt).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Faculty assignment</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{batch.facultyName}</p>
                <p className="mt-1 text-xs text-slate-500">Editable on the batch detail page</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Inspect the roster, schedule, and faculty assignment for this batch.</p>
              <Link
                href={`/batches/${batch.id}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
              >
                Open batch
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
