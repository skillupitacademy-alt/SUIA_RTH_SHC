import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAdminEnquiryDetail } from '@/lib/skillup-admin-data';

export default async function EnquiryDetailPage({ params }: { params: { id: string } }) {
  const enquiry = await getAdminEnquiryDetail(params.id);
  if (enquiry === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Enquiry detail</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{enquiry.studentName}</h2>
          <p className="mt-2 text-sm text-slate-600">
            {enquiry.program} · {enquiry.email} · {enquiry.phone}
          </p>
          <p className="mt-5 text-sm leading-7 text-slate-600">{enquiry.nextStep}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <form action={`/api/admin/crm/enquiries/${enquiry.id}/qualify`} method="post" className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Qualification</p>
              <p className="mt-2 text-sm text-slate-600">Move the enquiry to the next stage, log the action, and keep the saga trace visible.</p>
              <button className="mt-4 rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700">
                Qualify
              </button>
            </form>
            <form action={`/api/admin/crm/enquiries/${enquiry.id}/admit`} method="post" className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Admission</p>
              <p className="mt-2 text-sm text-slate-600">Finalize admission and trigger the payment-plan creation stage.</p>
              <button className="mt-4 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100">
                Admit
              </button>
            </form>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Timeline</p>
            <div className="mt-4 space-y-3">
              {enquiry.timeline.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">{new Date(item.at).toLocaleString()}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Counsellor notes</p>
            <div className="mt-4 space-y-2">
              {enquiry.notes.map((note) => (
                <div key={note} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {note}
                </div>
              ))}
            </div>
          </div>

          <Link href="/crm" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50">
            Back to CRM
          </Link>
        </aside>
      </div>
    </section>
  );
}
