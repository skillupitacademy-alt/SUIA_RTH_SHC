import { headers } from 'next/headers';
import Link from 'next/link';

import {
  type FacultyBatchSummary,
  type FacultyDashboardSummary,
  type FacultyHelpRequestItem,
  type FacultyReviewQueueItem,
  type FacultySessionRequestItem,
  getFacultyDashboardSummary,
  listFacultyBatches,
  listFacultyHelpRequests,
  listFacultyProjectReviews,
  listFacultySessionRequests,
} from '@/lib/faculty-live-data';

const quickActions = [
  { label: 'Review help requests', href: '/assignments/help', tone: 'cyan' },
  { label: 'Approve project work', href: '/assignments/projects', tone: 'emerald' },
  { label: 'Open assignments', href: '/assignments', tone: 'violet' },
  { label: 'View sessions', href: '/sessions', tone: 'violet' },
  { label: 'Mark attendance', href: '/attendance', tone: 'rose' },
  { label: 'Handle session requests', href: '/sessions/requests', tone: 'amber' },
  { label: 'Open my batches', href: '/my-batches', tone: 'slate' },
];

export default async function FacultyDashboardPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const emptySummary: FacultyDashboardSummary = {
    myBatches: 0,
    sessionsToday: 0,
    openHelpRequests: 0,
    pendingProjectReviews: 0,
    pendingSessionRequests: 0,
  };

  const [summary, batches, helpRequests, projectReviews, sessionRequests]: [
    FacultyDashboardSummary,
    FacultyBatchSummary[],
    FacultyHelpRequestItem[],
    FacultyReviewQueueItem[],
    FacultySessionRequestItem[],
  ] =
    userId === null || userId.length === 0
      ? [
          emptySummary,
          [],
          [],
          [],
          [],
        ]
      : await Promise.all([
          getFacultyDashboardSummary(requestHeaders, userId),
          listFacultyBatches(userId),
          listFacultyHelpRequests(requestHeaders, userId),
          listFacultyProjectReviews(requestHeaders, userId),
          listFacultySessionRequests(requestHeaders, userId),
        ]);

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Faculty dashboard</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Your live teaching queue at a glance</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            This surface keeps the Window 2 faculty decisions in one place: assignment help, project approvals, live session requests, and attendance follow-up.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-950"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </article>
        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Open work</p>
            <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">
              {summary.openHelpRequests + summary.pendingProjectReviews + summary.pendingSessionRequests}
            </p>
            <p className="mt-2 text-sm text-slate-600">Combined items awaiting faculty action.</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">My batches</p>
            <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">{summary.myBatches}</p>
            <p className="mt-2 text-sm text-slate-600">Assigned across active tracks and cohorts.</p>
          </div>
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'My batches', value: summary.myBatches, accent: 'cyan' },
          { label: "Today's sessions", value: summary.sessionsToday, accent: 'emerald' },
          { label: 'Open help requests', value: helpRequests.filter((item) => item.status !== 'resolved').length, accent: 'amber' },
          { label: 'Pending project reviews', value: projectReviews.length, accent: 'violet' },
          { label: 'Pending session requests', value: sessionRequests.length, accent: 'rose' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  stat.accent === 'cyan'
                    ? 'bg-cyan-500 w-[78%]'
                    : stat.accent === 'emerald'
                      ? 'bg-emerald-500 w-[60%]'
                      : stat.accent === 'amber'
                        ? 'bg-amber-500 w-[52%]'
                        : stat.accent === 'violet'
                          ? 'bg-violet-500 w-[65%]'
                          : 'bg-rose-500 w-[48%]'
                }`}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Assigned batches</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Current cohort summary</h3>
            </div>
            <Link href="/my-batches" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              View all
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {batches.slice(0, 4).map((batch) => (
              <div key={batch.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-600">{batch.track}</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{batch.name}</h4>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {batch.studentCount} students
                  </span>
                </div>
                <p className="mt-4 text-sm text-slate-600">Next session: {batch.nextSessionTopic}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">{new Date(batch.nextSessionAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Today&apos;s focus</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Open help requests', value: helpRequests.filter((item) => item.status !== 'resolved').length, detail: 'Tutorial assignment questions waiting on faculty review.' },
              { label: 'Needs-review projects', value: projectReviews.length, detail: 'Human approval is required before badge awarding.' },
              { label: 'Live session requests', value: sessionRequests.length, detail: 'Accept and schedule student doubt-clearing sessions.' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-sm">{item.value}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
