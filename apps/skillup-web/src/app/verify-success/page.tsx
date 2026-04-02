import Link from 'next/link';

export default function VerifySuccessPage() {
  return (
    <main className="surface-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[960px] items-center px-6 py-10">
        <section className="surface-card w-full rounded-[2.5rem] p-8 sm:p-10">
          <p className="section-kicker text-cyan-600">SkillUp Verification</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Email verified</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Your SkillUp account is ready. Sign in to continue with faculty-supported sessions, coursework, and updates.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(14,165,233,0.28)] transition hover:bg-cyan-600">
              Continue to login
            </Link>
            <Link href="/" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700">
              Open portal
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
