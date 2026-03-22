export default function NewBatchPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Create batch</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Create a new batch and assign faculty</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          This form is intentionally minimal for the scaffold. The POST endpoint exists at <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/api/admin/batches</code>.
        </p>
      </div>

      <form action="/api/admin/batches" method="post" className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Batch name</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white" name="name" placeholder="React Full Stack - April 2026" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Faculty</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white" name="facultyName" placeholder="Neha Kapoor" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Program</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white" name="program" placeholder="Web Development" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Capacity</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white" name="capacity" placeholder="32" />
          </label>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Start date</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white" name="startDate" placeholder="2026-04-01" />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Session topic</span>
            <input className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white" name="sessionTopic" placeholder="Hooks and state" />
          </label>
        </div>

        <button className="mt-6 rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700">
          Create batch
        </button>
      </form>
    </section>
  );
}
