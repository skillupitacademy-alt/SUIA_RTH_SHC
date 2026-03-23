import Link from 'next/link';

export const metadata = {
  title: 'Register',
  description: 'Create a SkillUp IT Academy student profile.',
};

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-10">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">SkillUp registration</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Create your learner profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Register here to join a program, then sign in through SkillHubCore for portal access across learning and exam surfaces.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <label htmlFor="skillup-full-name" className="block text-sm font-semibold text-slate-700">
              Full name
            </label>
            <input
              id="skillup-full-name"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
              type="text"
              placeholder="Aarav Patel"
            />
            <label htmlFor="skillup-mobile" className="mt-4 block text-sm font-semibold text-slate-700">
              Mobile number
            </label>
            <input
              id="skillup-mobile"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
              type="tel"
              placeholder="+91 90000 00000"
            />
            <label htmlFor="skillup-program" className="mt-4 block text-sm font-semibold text-slate-700">
              Program
            </label>
            <select id="skillup-program" className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300">
              <option>Full Stack Developer</option>
              <option>Data Analyst</option>
              <option>Cloud Support</option>
            </select>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Next step</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Registration is followed by SkillHubCore authentication and batch allocation by the operations team.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600">
                Sign in instead
              </Link>
              <Link href="/" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
                Back to home
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
