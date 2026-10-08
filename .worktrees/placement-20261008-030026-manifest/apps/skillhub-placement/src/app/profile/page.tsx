import Link from 'next/link';

import { PlacementAuthBridge } from '@/components/PlacementAuthBridge';
import { getPlacementViewer } from '@/lib/auth';
import { getPlacementTheme, resolvePlacementBrand } from '@/lib/brand';
import { getPlacementMatches, getPlacementProfile } from '@/lib/placement-data';

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const resolvedSearchParams = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[] | undefined>;
  const viewer = await getPlacementViewer();
  const brand = viewer?.brand ?? resolvePlacementBrand(firstParam(resolvedSearchParams.brand));
  const theme = getPlacementTheme(brand);

  if (viewer === null) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
        <section className="surface-panel rounded-[2.5rem] p-8">
          <p className="section-kicker text-slate-500">Placement profile</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Continue with your existing brand session.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If you already have an active {brand === 'realtutorialhub' ? 'Real Tutorial Hub' : 'SkillUp'} session, continue below to mint a shared `.skillhubcore.in` placement cookie.
          </p>
          <div className="mt-6">
            <PlacementAuthBridge brand={brand} redirectPath="/profile" buttonClass={theme.buttonClass} />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Return to job board
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const [profile, matches] = await Promise.all([
    getPlacementProfile(viewer.userId),
    getPlacementMatches(viewer.userId),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8 lg:py-10">
      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className={`section-kicker ${theme.accentClass}`}>Placement profile</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Your readiness and matched roles</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          This first shared placement pass reads your current profile and job matches from `placement_prod`.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Profile summary</p>
          {profile === null ? (
            <p className="mt-4 text-sm leading-7 text-slate-600">No placement profile is linked to this user yet.</p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Goal role</p>
                <p className="mt-1 text-sm text-slate-600">{profile.roleGoal}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Resume status</p>
                <p className="mt-1 text-sm text-slate-600">{profile.resumeStatus}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Profile completion</p>
                <p className="mt-1 text-sm text-slate-600">{profile.profileCompletion}%</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Skills</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <span key={skill} className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.chipClass}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </article>

        <article className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Matched jobs</p>
          <div className="mt-4 space-y-4">
            {matches.map((job) => (
              <div key={job.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{job.company}</p>
                    <p className="mt-1 text-sm text-slate-600">{job.title}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${theme.chipClass}`}>
                    {job.match}% match
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{job.location}</p>
                <div className="mt-4">
                  <Link href={`/jobs/${job.id}`} className={`rounded-full px-4 py-2 text-sm font-black transition ${theme.buttonClass}`}>
                    View job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
