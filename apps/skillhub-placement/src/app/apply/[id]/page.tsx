import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPlacementViewer } from '@/lib/auth';
import { getPlacementTheme } from '@/lib/brand';
import { getPlacementJob } from '@/lib/placement-data';

type ApplyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const [{ id }, viewer] = await Promise.all([params, getPlacementViewer()]);
  const job = await getPlacementJob(id);

  if (job === null) {
    notFound();
  }

  if (viewer === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
        <section className="surface-panel rounded-[2.5rem] p-8">
          <p className="section-kicker text-slate-500">Apply</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Application handoff is not fully wired yet.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            The shared placement host is live, but final authenticated application submission still depends on the shared session callback pass.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/jobs/${job.id}`} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Back to job detail
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const theme = getPlacementTheme(viewer.brand);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className={`section-kicker ${theme.accentClass}`}>Apply</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Application flow next: {job.title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This host now surfaces the correct shared placement UI. The next backend pass should persist applications and offers from this screen into `placement_prod`.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/jobs/${job.id}`} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Back to job detail
          </Link>
        </div>
      </section>
    </main>
  );
}
