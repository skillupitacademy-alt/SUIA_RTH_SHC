import Link from 'next/link';

import { fetchSkillupApi } from '@/lib/skillup-api';
import { formatCurrency, formatDateTime } from '@/lib/skillup-format';
import type { SkillupSession } from '@/lib/skillup-types';

type DashboardResponse = {
  summary: {
    nextSessionAt: string;
    paymentDue: number;
    outstandingInstallments: number;
    attendancePercent: number;
    progressPercent: number;
    upcomingSessions: number;
    placementMatches: number;
    facultyName: string;
    batchName: string;
    currentTopic: string;
  };
  sessions: SkillupSession[];
};

const quickLinks = [
  { href: '/student/my-batch', label: 'My batch' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/payments', label: 'Payments' },
  { href: '/student/placement', label: 'Placement' },
];

export default async function StudentDashboardPage() {
  const { summary, sessions } = await fetchSkillupApi<DashboardResponse>('/api/student/dashboard');

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
          <p className="section-kicker text-cyan-600">Student dashboard</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Your learning, attendance, and placement progress in one place</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            This view mirrors the platform&apos;s light shell language so students can move between batch work, attendance, payments, and job readiness without a visual jump.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </article>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Next session</p>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 font-outfit">{formatDateTime(summary.nextSessionAt)}</p>
            <p className="mt-2 text-sm text-slate-600">{summary.currentTopic}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Due balance</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">{formatCurrency(summary.paymentDue)}</p>
            <p className="mt-2 text-sm text-slate-600">{summary.outstandingInstallments} installments pending review.</p>
          </div>
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Attendance', value: `${summary.attendancePercent}%`, accent: 'emerald' },
          { label: 'Progress', value: `${summary.progressPercent}%`, accent: 'cyan' },
          { label: 'Upcoming sessions', value: summary.upcomingSessions, accent: 'amber' },
          { label: 'Job matches', value: summary.placementMatches, accent: 'rose' },
        ].map((stat) => (
          <article key={stat.label} className="surface-card rounded-3xl p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">{stat.value}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  stat.accent === 'emerald'
                    ? 'w-[86%] bg-emerald-500'
                    : stat.accent === 'cyan'
                      ? 'w-[68%] bg-cyan-500'
                      : stat.accent === 'amber'
                        ? 'w-[54%] bg-amber-500'
                        : 'w-[62%] bg-rose-500'
                }`}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Upcoming sessions</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">{summary.batchName}</h3>
            </div>
            <Link href="/student/my-batch" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Open batch
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {sessions.slice(0, 3).map((session) => (
              <div key={session.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {session.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDateTime(session.date)} - {session.mode}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Quick snapshot</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Batch faculty', value: summary.facultyName },
              { label: 'Current batch', value: summary.batchName },
              { label: 'Current topic', value: summary.currentTopic },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="mt-1 text-sm text-slate-600">{item.value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
