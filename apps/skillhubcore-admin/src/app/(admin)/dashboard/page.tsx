import Link from 'next/link';

import { adminDashboardSummary, adminSessionSummary, formatPlatform } from '@/lib/skillhubcore-admin-data';

const quickStats = [
  { label: 'Total users', value: adminDashboardSummary.totalUsers },
  { label: 'Active subscriptions', value: adminDashboardSummary.activeSubscriptions },
  { label: 'Active sessions', value: adminDashboardSummary.activeSessions },
];

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">SkillHubCore overview</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Users, subscriptions, and sessions at a glance</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          This screen surfaces the platform control plane without changing the established light admin styling.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/users" className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600">
            Manage users
          </Link>
          <Link href="/subscriptions" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
            Review subscriptions
          </Link>
          <Link href="/audit" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
            Open activity log
          </Link>
        </div>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        {quickStats.map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-black tracking-tight text-slate-950">{stat.value.toLocaleString('en-IN')}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Platform distribution</p>
          <div className="mt-6 space-y-4">
            {adminDashboardSummary.platformDistribution.map((item) => (
              <div key={item.platform} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{formatPlatform(item.platform)}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-sm">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Subscription mix</p>
          <div className="mt-6 space-y-4">
            {adminDashboardSummary.subscriptionDistribution.map((item) => (
              <div key={item.plan} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{item.plan}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-sm">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Active sessions</p>
          <div className="mt-6 space-y-3">
            {adminSessionSummary.map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                    {item.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Security note</p>
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm font-semibold text-amber-800">TOTP re-auth is required for user suspension and role changes.</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              The route handlers verify the code before mutating state, mirroring the documented SkillHubCore control flow.
            </p>
          </div>
        </article>
      </section>
    </section>
  );
}
