import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getSkillUpAdminRole } from '@/lib/admin-session';
import { RoleLockedNotice } from '@/components/role-locked-notice';
import { getAdminPlacementDetail } from '@/lib/skillup-admin-data';
import { PlacementEditForm } from '@/components/placement/PlacementEditForm';

export default async function PlacementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Placement is admin-only"
        description="Job matching and placement profile management are not shown in counsellor view."
      />
    );
  }

  const { id } = await params;
  const profile = await getAdminPlacementDetail(id);
  if (profile === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Placement detail</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{profile.studentName}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {profile.targetRole} · {profile.resumeStatus}
        </p>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Update the learner&apos;s placement readiness in place. This form writes back to the live `student_placement_profiles` table.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <PlacementEditForm profile={profile} />

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Match snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Completion</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{profile.matchScore}%</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Interviews</p>
                <p className="mt-2 text-3xl font-black text-slate-950">{profile.interviewCount}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Suggested jobs</p>
            <div className="mt-4 space-y-3">
              {profile.jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                  <p className="text-xs text-slate-500">
                    {job.company} · {job.location}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/placement"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Back to placement
          </Link>
        </aside>
      </div>
    </section>
  );
}
