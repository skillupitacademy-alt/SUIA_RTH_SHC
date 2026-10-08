import { adminDashboardSummary, adminMetricsSummary, formatCurrency, formatPlatform } from '@/lib/skillhubcore-admin-data';

const metricCards = [
  { label: 'Monthly active users', value: adminMetricsSummary.monthlyActiveUsers.toLocaleString('en-IN') },
  { label: 'MRR', value: formatCurrency(adminMetricsSummary.monthlyRecurringRevenue) },
  { label: 'Churn rate', value: `${adminMetricsSummary.churnRate.toFixed(1)}%` },
  { label: 'New users 30d', value: adminMetricsSummary.newUsers30d.toLocaleString('en-IN') },
  { label: 'Conversion rate', value: `${adminMetricsSummary.subscriptionConversionRate.toFixed(1)}%` },
  { label: 'Queue lag', value: `${adminMetricsSummary.processingLagSeconds}s` },
];

export default function MetricsPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-[16px]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Metrics</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight font-outfit text-slate-950">Revenue and growth signals</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          The control panel combines subscription performance, platform distribution, and event processing health into one view.
        </p>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        {metricCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-[16px]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Platform mix</p>
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

        <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Subscription distribution</p>
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
    </section>
  );
}
