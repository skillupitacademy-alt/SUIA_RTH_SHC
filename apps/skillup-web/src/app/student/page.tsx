import Link from 'next/link';

import {
  formatCurrency,
  formatDateTime,
  studentBatchDetails,
  studentDashboardSummary,
  studentInstallments,
  studentSessions,
} from '@/lib/skillup-demo-data';

const quickLinks = [
  { href: '/student/my-batch', label: 'My batch' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/payments', label: 'Payments' },
  { href: '/student/placement', label: 'Placement' },
];

export default function StudentDashboardPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Student dashboard</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Your learning, attendance, and placement progress in one place</h2>
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
          <div className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Next session</p>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">{formatDateTime(studentDashboardSummary.nextSessionAt)}</p>
            <p className="mt-2 text-sm text-slate-600">{studentBatchDetails.currentTopic}</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Due balance</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{formatCurrency(studentDashboardSummary.paymentDue)}</p>
            <p className="mt-2 text-sm text-slate-600">Payment reminders and installment history.</p>
          </div>
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Attendance', value: `${studentDashboardSummary.attendancePercent}%`, accent: 'emerald' },
          { label: 'Progress', value: `${studentDashboardSummary.progressPercent}%`, accent: 'cyan' },
          { label: 'Upcoming sessions', value: studentDashboardSummary.upcomingSessions, accent: 'amber' },
          { label: 'Job matches', value: studentDashboardSummary.placementMatches, accent: 'rose' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value}</p>
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
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Upcoming sessions</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{studentBatchDetails.name}</h3>
            </div>
            <Link href="/student/my-batch" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Open batch
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {studentSessions.slice(0, 3).map((session) => (
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

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Quick snapshot</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Batch faculty', value: studentDashboardSummary.facultyName },
              { label: 'Current batch', value: studentDashboardSummary.batchName },
              { label: 'Outstanding installments', value: studentInstallments.filter((item) => item.status !== 'paid').length.toString() },
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
