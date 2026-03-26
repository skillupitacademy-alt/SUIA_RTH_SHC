import Link from 'next/link';
import { Suspense } from 'react';
import { BookOpenCheck, ShieldCheck, Sparkles } from 'lucide-react';

import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login',
  description: 'Sign in to the SkillUp IT Academy student portal.',
};

export default function LoginPage() {
  return (
    <main className="surface-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1440px] items-center px-6 py-10 lg:px-8">
        <section className="surface-panel grid w-full overflow-hidden rounded-[3rem] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative hidden min-h-[760px] items-center justify-center border-r border-slate-200/80 bg-[linear-gradient(to_right,rgba(255,255,255,0.35),rgba(255,255,255,0.12)),radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_34%)] p-12 lg:flex">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-10 max-w-xl">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-600 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <p className="section-kicker text-cyan-600">SkillUp Student Portal</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 font-outfit">
                Secure access to learning, attendance, and placement tools.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-slate-500">
                The same clean portal system as RTH, tuned for SkillUp&apos;s cyan brand and student workflow.
              </p>

              <div className="mt-12 grid gap-5 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <p className="text-3xl font-black text-slate-950">100%</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-slate-400">HttpOnly cookies</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <p className="text-3xl font-black text-slate-950">3</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-slate-400">Student flows</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                  <BookOpenCheck size={16} className="text-cyan-600" />
                  Study plan
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                  <Sparkles size={16} className="text-cyan-600" />
                  Placement ready
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-xl">
              <div className="mb-6 lg:hidden">
                <p className="section-kicker text-cyan-600">SkillUp Student Portal</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Student Portal</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Enter your credentials to access the learning, attendance, and placement surfaces.
                </p>
              </div>

              <div className="surface-card rounded-[2.5rem] p-6 sm:p-8">
                <Suspense fallback={<div className="h-[420px] animate-pulse rounded-[1.5rem] bg-slate-100" />}>
                  <LoginForm />
                </Suspense>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white/70 px-5 py-4 text-sm text-slate-600 shadow-sm">
                <span>Need an account?</span>
                <Link href="/register" className="font-bold text-cyan-700 transition hover:text-cyan-900">
                  Go to registration
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
