const stats = [
  { label: 'Active users', value: '4,208' },
  { label: 'Subscriptions', value: '1,042' },
  { label: 'Audit entries', value: '88k' },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-violet-300">SkillHubCore Admin</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Management console scaffold</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            User control, subscription lifecycle, and audit visibility will land here in the next phase.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{stat.value}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
