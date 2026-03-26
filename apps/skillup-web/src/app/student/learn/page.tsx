import Link from 'next/link';
import { BookOpen, Code2, GraduationCap, PlayCircle, Sparkles } from 'lucide-react';

const learningModules = [
  {
    title: 'React foundations',
    description: 'Component composition, props, state, and UI behavior.',
    accent: 'bg-cyan-500',
  },
  {
    title: 'Next.js routing',
    description: 'App Router, layouts, loading states, and route protection.',
    accent: 'bg-sky-500',
  },
  {
    title: 'API integration',
    description: 'Fetching, auth cookies, and server-backed data flows.',
    accent: 'bg-indigo-500',
  },
];

export default function LearnPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Learn</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Study workspace and lesson resources</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          The SkillUp learning surface keeps lessons, recordings, and practice links inside the same portal layout used across the app.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="surface-panel rounded-[2rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="section-kicker text-slate-500">Modules</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950 font-outfit">Current learning path</h3>
            </div>
            <Link href="/student/my-batch" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
              Batch details
            </Link>
          </div>
          <div className="mt-6 space-y-4">
            {learningModules.map((module) => (
              <div key={module.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 h-12 w-12 rounded-2xl ${module.accent} flex items-center justify-center text-white shadow-sm`}>
                    <Code2 size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">{module.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{module.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                        Notes
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700">
                        Recording
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="surface-panel rounded-[2rem] p-6">
          <p className="section-kicker text-slate-500">Resources</p>
          <div className="mt-6 space-y-4">
            {[
              { icon: BookOpen, title: 'Lesson notes', body: 'Batch notes and module summaries stay available for quick review.' },
              { icon: PlayCircle, title: 'Session recordings', body: 'Completed session recordings can be reopened from the same workspace.' },
              { icon: GraduationCap, title: 'Mentor support', body: 'Faculty review and guided practice are surfaced where students already work.' },
              { icon: Sparkles, title: 'Practice tasks', body: 'Short skill checks and practice prompts support the current module.' },
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
