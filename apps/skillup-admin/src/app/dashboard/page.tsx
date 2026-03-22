const metrics = [
  { label: 'Students', value: '1,284' },
  { label: 'Batches', value: '42' },
  { label: 'Revenue', value: '₹18.2L' },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-amber-300">SkillUp Admin</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Operations portal scaffold</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Entry point for admissions, batch control, payments, and placement operations.
          </p>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-6">
              <p className="text-sm text-slate-400">{metric.label}</p>
              <p className="mt-2 text-3xl font-black text-white">{metric.value}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
