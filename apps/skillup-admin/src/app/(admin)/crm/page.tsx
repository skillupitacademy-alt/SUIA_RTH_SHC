import Link from 'next/link';

import { adminEnquiries } from '@/lib/admin-demo-data';

const statusStyles: Record<string, string> = {
  new: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  qualified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  admitted: 'border-violet-200 bg-violet-50 text-violet-700',
  needs_followup: 'border-amber-200 bg-amber-50 text-amber-700',
};

export default function CrmPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">CRM</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Enquiries and admission saga queue</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Qualify enquiries, move them through admission, and keep the audit trail visible for every step of the conversion journey.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {adminEnquiries.map((enquiry) => (
          <article key={enquiry.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{enquiry.program}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{enquiry.studentName}</h3>
                <p className="mt-2 text-sm text-slate-600">{enquiry.email}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusStyles[enquiry.status]}`}>{enquiry.status}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Counsellor</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{enquiry.counsellor}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Created</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{new Date(enquiry.createdAt).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Open the enquiry detail to see timeline, counsellor notes, and saga steps.</p>
              <Link
                href={`/crm/enquiries/${enquiry.id}`}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
              >
                Open detail
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
