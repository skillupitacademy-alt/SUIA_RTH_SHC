import Link from 'next/link';

import { JobCard } from '@/components/JobCard';
import { getPlacementViewer } from '@/lib/auth';
import { getPlacementTheme, resolvePlacementBrand } from '@/lib/brand';
import { listPlacementJobs } from '@/lib/placement-data';

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [params, viewer, jobs] = await Promise.all([
    searchParams ?? Promise.resolve({}),
    getPlacementViewer(),
    listPlacementJobs(),
  ]);
  const resolvedParams = params as Record<string, string | string[] | undefined>;

  const brand = viewer?.brand ?? resolvePlacementBrand(firstParam(resolvedParams.brand));
  const theme = getPlacementTheme(brand);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <section className={`surface-panel overflow-hidden rounded-[2.75rem] border ${theme.borderClass} p-8 lg:p-10`}>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className={`section-kicker ${theme.accentClass}`}>Shared placement service</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 lg:text-6xl">
              Placement for both brands, one shared hiring surface.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 lg:text-base">
              {theme.name} learners land here to review readiness, explore live roles, and move toward screening without switching to a separate brand-locked tool.
            </p>
            <p className={`mt-4 inline-flex rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.28em] ${theme.chipClass}`}>
              {theme.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/profile" className={`rounded-full px-5 py-3 text-sm font-black transition ${theme.buttonClass}`}>
                {viewer !== null ? 'Open my placement profile' : 'Open profile shell'}
              </Link>
              <Link href="#jobs" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Browse live jobs
              </Link>
            </div>
          </div>
          <aside className={`rounded-[2rem] border ${theme.borderClass} ${theme.softClass} p-6`}>
            <p className="section-kicker text-slate-500">Current rollout</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-700">
              <p>This host is now backed by a real shared frontend instead of the protected SkillHub core service.</p>
              <p>Placement data is already coming from `placement_prod` via `@quiz/db-placement`.</p>
              <p>Shadow-user normalization and full cross-domain callback flow remain a follow-up pass.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="jobs" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={`section-kicker ${theme.accentClass}`}>Open roles</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Live job board for shared placement</h2>
          </div>
          <p className="text-sm text-slate-600">{jobs.length} roles currently surfaced</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} theme={theme} />
          ))}
        </div>
      </section>
    </main>
  );
}
