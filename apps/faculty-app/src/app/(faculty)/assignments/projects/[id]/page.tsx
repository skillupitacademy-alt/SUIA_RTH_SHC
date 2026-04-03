import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

import { ProjectReviewDetailForm } from '@/components/project-review-detail-form';
import { listFacultyReviewQueue } from '@/lib/faculty-live-data';
import { getEffectiveUserId } from '@/lib/request-auth';

type ProjectReviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectReviewPage({ params }: ProjectReviewPageProps) {
  const { id } = await params;
  const requestHeaders = await headers();
  const userId = getEffectiveUserId(requestHeaders);
  const submissions = userId === null || userId.length === 0 ? [] : await listFacultyReviewQueue(requestHeaders, userId);
  const submission = submissions.find((item) => item.id === id);

  if (submission === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Project reviews</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{submission.projectName}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{submission.aiFeedback}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{submission.studentName}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{submission.status}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(submission.submittedAt).toLocaleString()}</span>
        </div>
      </div>

      <ProjectReviewDetailForm submission={submission} />

      <div>
        <Link href="/assignments/projects" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
          Back to project reviews
        </Link>
      </div>
    </section>
  );
}
