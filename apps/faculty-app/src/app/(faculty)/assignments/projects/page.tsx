import { headers } from 'next/headers';

import { ProjectReviewsPanel } from '@/components/project-reviews-panel';
import { listFacultyReviewQueue } from '@/lib/faculty-live-data';

export default async function ProjectReviewsPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const submissions = userId === null || userId.length === 0 ? [] : await listFacultyReviewQueue(requestHeaders, userId);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Project reviews</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Submissions awaiting human approval</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          AI only gets the project to the review queue. Faculty still makes the final call for approval or revision.
        </p>
      </div>
      <div className="mt-6">
        <ProjectReviewsPanel submissions={submissions} />
      </div>
    </section>
  );
}
