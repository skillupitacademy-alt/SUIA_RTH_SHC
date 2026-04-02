import Link from 'next/link';

import type { PlacementTheme } from '@/lib/brand';
import type { PlacementJobSummary } from '@/lib/placement-data';

export function JobCard({ job, theme }: { job: PlacementJobSummary; theme: PlacementTheme }) {
  return (
    <article className="surface-panel rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`section-kicker ${theme.accentClass}`}>{job.company}</p>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">{job.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{job.location}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${theme.chipClass}`}>
          {job.match}% match
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-600">{job.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {job.skills.map((skill) => (
          <span key={skill} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{job.salary}</p>
        <div className="flex flex-wrap gap-3">
          <Link href={`/jobs/${job.id}`} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            View details
          </Link>
          <Link href={`/apply/${job.id}`} className={`rounded-full px-4 py-2 text-sm font-bold transition ${theme.buttonClass}`}>
            Apply
          </Link>
        </div>
      </div>
    </article>
  );
}
