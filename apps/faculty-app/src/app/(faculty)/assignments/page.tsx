import { headers } from 'next/headers';
import Link from 'next/link';

import { listFacultyAssignments } from '@/lib/faculty-live-data';

export default async function AssignmentsPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const assignments = userId === null || userId.length === 0 ? [] : await listFacultyAssignments(userId);

  const publishedCount = assignments.filter((item) => item.isPublished).length;
  const helpRequestCount = assignments.reduce((sum, item) => sum + item.helpRequestCount, 0);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Assignments</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Tutorial assignments available for your cohorts</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This hub keeps the assignment catalogue in one place so faculty can see the published tasks, the active question type, and where students are asking for help.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/assignments/help"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Help requests
          </Link>
          <Link
            href="/assignments/projects"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            Project reviews
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Assignments loaded', value: assignments.length, accent: 'cyan' },
          { label: 'Published', value: publishedCount, accent: 'emerald' },
          { label: 'Help requests linked', value: helpRequestCount, accent: 'amber' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  stat.accent === 'cyan' ? 'bg-cyan-500 w-[78%]' : stat.accent === 'emerald' ? 'bg-emerald-500 w-[65%]' : 'bg-amber-500 w-[54%]'
                }`}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {assignments.map((assignment) => (
          <article key={assignment.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">{assignment.subtopic}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{assignment.title}</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] ${
                  assignment.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {assignment.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-600">{assignment.question}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Difficulty</p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{assignment.difficulty}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Type</p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{assignment.questionType}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Points</p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{assignment.points}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Help requests</p>
                <p className="mt-2 text-lg font-black tracking-tight text-slate-950">{assignment.helpRequestCount}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
