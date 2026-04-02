import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPlacementViewer } from '@/lib/auth';
import { getPlacementTheme } from '@/lib/brand';
import { getPlacementJob } from '@/lib/placement-data';

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const [{ id }, viewer] = await Promise.all([params, getPlacementViewer()]);
  const job = await getPlacementJob(id);

  if (job === null) {
    notFound();
  }

  const theme = getPlacementTheme(viewer?.brand ?? 'skillup');

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-8 lg:py-10">
      <Link href="/" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
        Back to jobs
      </Link>

      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className={`section-kicker ${theme.accentClass}`}>{job.company}</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{job.title}</h1>
        <p className="mt-3 text-sm font-semibold text-slate-600">{job.location}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {skill}
            </span>
          ))}
        </div>
        <p className="mt-6 text-base leading-8 text-slate-700">{job.description}</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-slate-900">{job.salary}</p>
          <Link href={`/apply/${job.id}`} className={`rounded-full px-5 py-3 text-sm font-black transition ${theme.buttonClass}`}>
            Continue to apply
          </Link>
        </div>
      </section>
    </main>
  );
}
