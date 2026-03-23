import Link from 'next/link';

export function RoleLockedNotice({ title, description }: { title: string; description: string }) {
  return (
    <section className="mx-auto max-w-4xl px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Access limited</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
        <div className="mt-6">
          <Link href="/dashboard" className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700">
            Return to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
