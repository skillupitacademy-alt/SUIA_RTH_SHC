import Link from 'next/link';

const programs = [
  {
    title: 'Full Stack Developer',
    description: 'Structured learning tracks for modern web application delivery.',
  },
  {
    title: 'Data Analyst',
    description: 'Spreadsheet, SQL, BI, and reporting foundations with guided mentorship.',
  },
  {
    title: 'Cloud Support',
    description: 'Ops, observability, incident response, and deployment workflows.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.2),_transparent_40%),linear-gradient(180deg,_#07111f_0%,_#0f172a_100%)] px-6 py-12 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="max-w-3xl space-y-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">SkillUp IT Academy</p>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              Student portal scaffold for onboarding, learning, and placements.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300">
              This shell gives students a single place to track progress, reach the faculty desk, and
              move through the academy workflow while the feature pages are being built.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/student"
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Open student area
              </Link>
              <a
                href={process.env.SKILLHUBCORE_LOGIN_URL ?? 'https://api.skillhubcore.in/login'}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Continue with SkillHubCore
              </a>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {programs.map((program) => (
            <article key={program.title} className="rounded-2xl border border-white/10 bg-slate-950/40 p-6">
              <h2 className="text-lg font-bold text-white">{program.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{program.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
