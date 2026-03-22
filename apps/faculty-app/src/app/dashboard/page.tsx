const stats = [
  { label: 'Batches', value: '8' },
  { label: 'Sessions today', value: '14' },
  { label: 'Open reviews', value: '27' },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-xs font-black uppercase tracking-[0.32em] text-emerald-300">Faculty App</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Faculty workspace scaffold</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Batch sessions, attendance, assignment help, project approval, and live session requests
            will land here in the next phase.
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
