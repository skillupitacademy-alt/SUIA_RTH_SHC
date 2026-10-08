import { adminEventLog, adminMetricsSummary, formatDateTime } from '@/lib/skillhubcore-admin-data';

const statusStyles: Record<string, string> = {
  published: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  consumed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  retrying: 'border-amber-200 bg-amber-50 text-amber-700',
  failed: 'border-rose-200 bg-rose-50 text-rose-700',
};

export default function EventsPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-[16px]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Events</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight font-outfit text-slate-950">Recent QStash activity</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This feed traces user registration, payment receipt, and subscription upgrade events across the SkillHubCore consumers.
        </p>
      </article>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Events today', value: adminMetricsSummary.qstashEvents24h.toLocaleString('en-IN') },
          { label: 'Processing lag', value: `${adminMetricsSummary.processingLagSeconds}s` },
          { label: 'Retry rate', value: '1.8%' },
        ].map((stat) => (
          <article key={stat.label} className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-[16px]">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="space-y-3">
        {adminEventLog.map((event) => (
          <details key={event.id} className="rounded-[1.75rem] border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-[16px]">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{event.eventType}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {event.userName} - {event.source}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] text-slate-600">
                    {event.consumer}
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.28em] ${statusStyles[event.status] ?? statusStyles.consumed}`}>
                    {event.status}
                  </span>
                </div>
              </div>
            </summary>

            <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Created at</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{formatDateTime(event.createdAt)}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">User</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{event.userId}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">{event.details}</p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Payload</p>
                <pre className="mt-2 whitespace-pre-wrap text-xs leading-6 text-slate-700">{JSON.stringify(event.payload, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}
      </section>
    </section>
  );
}
