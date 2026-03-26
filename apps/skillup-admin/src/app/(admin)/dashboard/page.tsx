import Link from 'next/link';

import { formatCurrency, getAdminDashboardSummary, listAdminActivityFeed, listAdminStudents } from '@/lib/skillup-admin-data';
import { canAccessFinance, getSkillUpAdminRole } from '@/lib/admin-session';

export default async function AdminDashboardPage() {
  const role = await getSkillUpAdminRole();
  const canSeeFinance = canAccessFinance(role);
  const [summary, activityFeed, students] = await Promise.all([
    getAdminDashboardSummary(),
    listAdminActivityFeed(),
    listAdminStudents(),
  ]);
  const quickActions = canSeeFinance
    ? [
        { href: '/students', label: 'Add student' },
        { href: '/batches/new', label: 'Create batch' },
        { href: '/payments', label: 'Record payment' },
        { href: '/crm', label: 'Review enquiries' },
      ]
    : [{ href: '/students', label: 'Add student' }, { href: '/crm', label: 'Review enquiries' }];

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">SkillUp admin dashboard</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Admissions, billing, and placement in one light shell</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
            Monitor the core operational surface for the academy: student growth, active batches, revenue, and placement movement, with quick links into the work queues.
          </p>
          {role === 'counsellor' ? (
            <div className="mt-5 rounded-3xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
              Counsellor view is focused on students and CRM. Finance, batches, and placement are hidden from navigation.
            </div>
          ) : null}
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
          {canSeeFinance ? (
            <div className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">Placement rate</p>
              <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">{summary.placementRate}%</p>
              <p className="mt-2 text-sm text-slate-600">Learners moving into interviews and offers.</p>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-cyan-200 bg-cyan-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-700">CRM focus</p>
              <p className="mt-3 text-5xl font-black tracking-tight text-slate-950">{students.filter((student) => student.paymentStatus !== 'current').length}</p>
              <p className="mt-2 text-sm text-slate-600">Students needing follow-up before the next counselling touchpoint.</p>
            </div>
          )}
          {canSeeFinance ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Monthly revenue</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{formatCurrency(summary.monthlyRevenue)}</p>
              <p className="mt-2 text-sm text-slate-600">Current billing cycle collections and receipts.</p>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Counsellor focus</p>
              <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{students.filter((student) => student.paymentStatus !== 'current').length}</p>
              <p className="mt-2 text-sm text-slate-600">Students needing follow-up across CRM and admissions.</p>
            </div>
          )}
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(
          canSeeFinance
          ? [
                { label: 'Total students', value: summary.totalStudents, accent: 'cyan' },
                { label: 'Active batches', value: summary.activeBatches, accent: 'emerald' },
                { label: 'Monthly revenue', value: formatCurrency(summary.monthlyRevenue), accent: 'amber' },
                { label: 'Placement rate', value: `${summary.placementRate}%`, accent: 'rose' },
              ]
            : [
                { label: 'Total students', value: summary.totalStudents, accent: 'cyan' },
                { label: 'Active batches', value: summary.activeBatches, accent: 'emerald' },
                { label: 'Students needing follow-up', value: students.filter((student) => student.paymentStatus !== 'current').length, accent: 'amber' },
                { label: 'Open CRM enquiries', value: 3, accent: 'rose' },
              ]
        ).map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value}</p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${
                  stat.accent === 'cyan'
                    ? 'w-[80%] bg-cyan-500'
                    : stat.accent === 'emerald'
                      ? 'w-[62%] bg-emerald-500'
                      : stat.accent === 'amber'
                        ? 'w-[58%] bg-amber-500'
                        : 'w-[52%] bg-rose-500'
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
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Recent activity</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Admissions and billing feed</h3>
            </div>
            <Link href="/crm" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Open CRM
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {activityFeed.map((item) => (
              <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      item.tone === 'cyan'
                        ? 'border border-cyan-200 bg-cyan-50 text-cyan-700'
                        : item.tone === 'emerald'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : item.tone === 'amber'
                            ? 'border border-amber-200 bg-amber-50 text-amber-700'
                            : item.tone === 'rose'
                              ? 'border border-rose-200 bg-rose-50 text-rose-700'
                              : 'border border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {new Date(item.at).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Ops snapshot</p>
          <div className="mt-6 space-y-4">
            {(
              canSeeFinance
          ? [
                { label: 'Students needing follow-up', value: students.filter((student) => student.paymentStatus !== 'current').length },
                { label: 'Active admission queues', value: summary.activeAdmissionQueues },
                { label: 'Jobs matched to learners', value: summary.jobsMatched },
              ]
                : [
                { label: 'Students needing follow-up', value: students.filter((student) => student.paymentStatus !== 'current').length },
                { label: 'Open CRM enquiries', value: summary.openEnquiries },
                { label: 'Upcoming callbacks', value: summary.upcomingCallbacks },
              ]
            ).map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-sm">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
