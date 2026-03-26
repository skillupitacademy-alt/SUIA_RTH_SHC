import Link from 'next/link';
import { ArrowRight, BadgeCheck, BookOpenText, ClipboardCheck, TimerReset } from 'lucide-react';

const examTracks = [
  {
    title: 'Weekly module quiz',
    subtitle: 'Code review and concept checks',
    status: 'Open',
    duration: '30 min',
  },
  {
    title: 'Project checkpoint',
    subtitle: 'Applied skills and delivery review',
    status: 'Scheduled',
    duration: '45 min',
  },
  {
    title: 'Mock interview drill',
    subtitle: 'Placement readiness and speaking',
    status: 'Practice',
    duration: '20 min',
  },
];

export default function ExamsPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Assessments</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Practice, checkpoint, and placement assessments</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The SkillUp exam surface stays inside the portal so learners can review readiness without leaving the brand experience.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Exam list</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">Available assessment tracks</h3>
            </div>
            <Link href="/student/placement" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Placement view
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {examTracks.map((track) => (
              <div key={track.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{track.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{track.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                    {track.status}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                    <TimerReset size={14} className="text-cyan-600" />
                    {track.duration}
                  </p>
                  <button className="inline-flex items-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-600">
                    Start practice
                    <ArrowRight className="ml-2" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Assessment notes</p>
          <div className="mt-6 space-y-4">
            {[
              { icon: ClipboardCheck, title: 'Readiness', body: 'Learners should review current batch topics before attempting practice checks.' },
              { icon: BookOpenText, title: 'Study path', body: 'Modules and exercises stay inside the portal so progress is easy to return to.' },
              { icon: BadgeCheck, title: 'Outcome', body: 'Performance feeds placement guidance and mentor follow-up inside the same shell.' },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </section>
  );
}
