export default function StudentDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">Student area</p>
        <h1 className="text-3xl font-black tracking-tight">SkillUp student dashboard scaffold</h1>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Protected student-only route placeholder. Core batch, attendance, payments, and placement
          flows will land here in the next phase.
        </p>
      </div>
    </main>
  );
}
