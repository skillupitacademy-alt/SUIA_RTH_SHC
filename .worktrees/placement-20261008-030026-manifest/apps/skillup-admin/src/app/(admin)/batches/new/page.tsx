import { BatchCreateForm } from '@/components/batches/batch-create-form';

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

      <BatchCreateForm />
    </section>
  );
}
