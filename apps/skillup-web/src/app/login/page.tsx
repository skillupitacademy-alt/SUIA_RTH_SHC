import Link from 'next/link';

export const metadata = {
  title: 'Login',
  description: 'Sign in to the SkillUp IT Academy student portal.',
};

const loginUrl = process.env.SKILLHUBCORE_LOGIN_URL ?? 'https://api.skillhubcore.in/login';

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-10">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">SkillUp login</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Continue with SkillHubCore</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Students sign in through SkillHubCore, then return here with a shared JWT cookie for the learning and placement surfaces.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <form className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700">
                Email
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-cyan-300" type="email" placeholder="student@example.com" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                Password
                <input className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 focus:border-cyan-300" type="password" placeholder="Enter your password" />
              </label>
              <a href={loginUrl} className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600">
                Sign in with SkillHubCore
              </a>
            </div>
          </form>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Need an account?</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use the registration surface to create a student profile, then complete authentication through SkillHubCore.
            </p>
            <Link href="/register" className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
              Go to registration
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
