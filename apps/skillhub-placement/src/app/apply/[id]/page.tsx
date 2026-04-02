import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { PlacementAuthBridge } from '@/components/PlacementAuthBridge';
import { getPlacementViewer } from '@/lib/auth';
import { getPlacementTheme, resolvePlacementBrand, withPlacementBrand } from '@/lib/brand';
import { createPlacementApplication, getPlacementApplication, getPlacementJob } from '@/lib/placement-data';

type ApplyPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAppliedAt(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default async function ApplyPage({ params, searchParams }: ApplyPageProps) {
  const [{ id }, viewer, resolvedSearchParams] = await Promise.all([
    params,
    getPlacementViewer(),
    searchParams ?? Promise.resolve({}),
  ]);
  const query = resolvedSearchParams as Record<string, string | string[] | undefined>;
  const job = await getPlacementJob(id);

  if (job === null) {
    notFound();
  }

  const brand = viewer?.brand ?? resolvePlacementBrand(firstParam(query.brand));
  const status = firstParam(query.status);

  if (viewer === null) {
    const theme = getPlacementTheme(brand);
    return (
      <main className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
        <section className="surface-panel rounded-[2.5rem] p-8">
          <p className="section-kicker text-slate-500">Apply</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Continue with your existing brand session.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            If you already have an active {brand === 'realtutorialhub' ? 'Real Tutorial Hub' : 'SkillUp'} session, continue below to mint a shared `.skillhubcore.in` placement cookie before applying.
          </p>
          <div className="mt-6">
            <PlacementAuthBridge
              brand={brand}
              redirectPath={withPlacementBrand(`/apply/${job.id}`, brand)}
              buttonClass={theme.buttonClass}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={withPlacementBrand(`/jobs/${job.id}`, brand)} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
              Back to job detail
            </Link>
          </div>
        </section>
      </main>
    );
  }

  async function submitApplication(formData: FormData) {
    'use server';

    const currentViewer = await getPlacementViewer();
    if (currentViewer === null) {
      redirect(withPlacementBrand(`/apply/${id}?status=signin-required`, brand));
    }

    const noteValue = formData.get('notes');
    const notes =
      typeof noteValue === 'string' && noteValue.trim().length > 0
        ? noteValue.trim().slice(0, 2000)
        : null;

    const result = await createPlacementApplication(currentViewer.userId, id, notes);
    redirect(
      withPlacementBrand(
        `/apply/${id}?status=${result.created ? 'applied' : 'exists'}`,
        currentViewer.brand,
      ),
    );
  }

  const application = await getPlacementApplication(viewer.userId, id);
  const theme = getPlacementTheme(viewer.brand);

  return (
    <main className="mx-auto max-w-3xl px-6 py-8 lg:py-10">
      <section className="surface-panel rounded-[2.5rem] p-8">
        <p className={`section-kicker ${theme.accentClass}`}>Apply</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{job.title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Submit a first-pass shared placement application against `placement_prod`. This stores the application once and prevents duplicate applies for the same job.
        </p>

        {status === 'applied' ? (
          <div className={`mt-6 rounded-3xl border px-4 py-4 text-sm font-semibold ${theme.chipClass}`}>
            Application submitted on the shared placement host.
          </div>
        ) : null}
        {status === 'exists' ? (
          <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
            You already applied to this job from the shared placement host.
          </div>
        ) : null}
        {status === 'signin-required' ? (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-800">
            Sign-in is still required before an application can be submitted.
          </div>
        ) : null}

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">Role summary</p>
          <p className="mt-2 text-sm text-slate-600">{job.company}</p>
          <p className="mt-1 text-sm text-slate-600">{job.location}</p>
          <p className="mt-3 text-sm font-semibold text-slate-800">{job.salary}</p>
        </div>

        {application !== null ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-900">Application already recorded</p>
            <p className="mt-2 text-sm text-emerald-800">
              Status: {application.status} | Applied: {formatAppliedAt(application.appliedAt)}
            </p>
            {application.notes !== null ? (
              <p className="mt-3 text-sm leading-7 text-emerald-900">{application.notes}</p>
            ) : null}
          </div>
        ) : (
          <form action={submitApplication} className="mt-6 space-y-4">
            <div>
              <label htmlFor="notes" className="text-sm font-semibold text-slate-800">
                Short note for the placement team
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={5}
                maxLength={2000}
                placeholder="Add a short note about your background, availability, or why this role fits."
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
              />
            </div>
            <button type="submit" className={`rounded-full px-5 py-3 text-sm font-black transition ${theme.buttonClass}`}>
              Submit application
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={withPlacementBrand(`/jobs/${job.id}`, viewer.brand)} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Back to job detail
          </Link>
        </div>
      </section>
    </main>
  );
}
