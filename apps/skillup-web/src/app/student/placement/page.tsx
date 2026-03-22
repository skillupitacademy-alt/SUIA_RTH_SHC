import { studentJobMatches, studentPlacementProfile } from '@/lib/skillup-demo-data';

export default function PlacementPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Placement</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Profile readiness and job matches</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Placement data stays visible in the same portal, with profile readiness and matching jobs surfaced together.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Profile</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Goal role</p>
              <p className="mt-1 text-sm text-slate-600">{studentPlacementProfile.roleGoal}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Resume</p>
              <p className="mt-1 text-sm text-slate-600">{studentPlacementProfile.resumeStatus}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Profile completion</p>
              <p className="mt-1 text-sm text-slate-600">{studentPlacementProfile.profileCompletion}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Interview count</p>
              <p className="mt-1 text-sm text-slate-600">{studentPlacementProfile.interviewCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Core skills</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {studentPlacementProfile.skills.map((skill) => (
                  <span key={skill} className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Job matches</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Roles aligned to your profile</h3>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700">
              Ready for apply
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {studentJobMatches.map((job) => (
              <div key={job.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{job.company}</p>
                    <p className="mt-1 text-sm text-slate-600">{job.title}</p>
                  </div>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {job.match}% match
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{job.location}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-600">
                    Apply
                  </button>
                  <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
                    Save
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
