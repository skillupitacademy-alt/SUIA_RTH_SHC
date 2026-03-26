import { getSkillUpAdminRole } from '@/lib/admin-session';
import { RoleLockedNotice } from '@/components/role-locked-notice';
import { listAdminJobPostings, listAdminPlacementProfiles } from '@/lib/skillup-admin-data';

export default async function PlacementPage() {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Placement is admin-only"
        description="Job matching and placement profile management are not shown in counsellor view."
      />
    );
  }

  const [adminPlacementProfiles, adminJobPostings] = await Promise.all([
    listAdminPlacementProfiles(),
    listAdminJobPostings(),
  ]);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Placement</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Profiles, job postings, and matching</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Keep student placement readiness and job matching in one light, decision-oriented surface.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Student profiles</p>
          <div className="mt-4 space-y-3">
            {adminPlacementProfiles.map((profile) => (
              <div key={profile.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{profile.studentName}</p>
                    <p className="text-xs text-slate-500">
                      {profile.targetRole} · {profile.location}
                    </p>
                  </div>
                  <p className="text-sm font-black text-slate-950">{profile.matchScore}%</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">Matches: {profile.jobMatches.join(', ')}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Job postings</p>
          <div className="mt-4 space-y-3">
            {adminJobPostings.map((job) => (
              <div key={job.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{job.title}</p>
                    <p className="text-xs text-slate-500">
                      {job.company} · {job.location}
                    </p>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">{job.applicants} applicants</p>
                </div>
                <p className="mt-2 text-sm text-slate-600">Skills: {job.skills.join(', ')}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
