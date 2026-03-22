import Link from 'next/link';
import { notFound } from 'next/navigation';

import { findAdminBatch } from '@/lib/admin-demo-data';

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const batch = findAdminBatch(params.id);
  if (batch === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Batch detail</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{batch.name}</h2>
          <p className="mt-2 text-sm text-slate-600">{batch.program} · {batch.facultyName}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Students</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{batch.studentCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Capacity</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{batch.capacity}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Next session</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{new Date(batch.nextSessionAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-700">Faculty assignment</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              The batch detail page is where staffing decisions are reviewed. The create and assign flow is surfaced here in the same light card style.
            </p>
            <p className="mt-3 text-sm font-semibold text-slate-900">Assigned faculty: {batch.assignedFaculty}</p>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Session schedule</p>
            <div className="mt-4 space-y-3">
              {batch.schedule.map((slot) => (
                <div key={slot.day} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{slot.day}</p>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{slot.time}</p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{slot.topic}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Student roster</p>
            <div className="mt-4 space-y-3">
              {batch.students.map((student) => (
                <div key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{student.name}</p>
                    <p className="text-sm font-black text-slate-950">{student.attendancePct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/batches" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50">
            Back to batches
          </Link>
        </aside>
      </div>
    </section>
  );
}
