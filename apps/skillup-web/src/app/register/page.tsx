import Link from 'next/link';
import { GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Register',
  description: 'Create a SkillUp IT Academy student profile.',
};

export default function RegisterPage() {
  return (
    <main className="surface-shell min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen max-w-[1440px] items-center px-6 py-10 lg:px-8">
        <section className="surface-panel grid w-full overflow-hidden rounded-[3rem] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[760px] items-center justify-center border-r border-slate-200/80 bg-[linear-gradient(to_right,rgba(255,255,255,0.35),rgba(255,255,255,0.12)),radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_34%)] p-12 lg:flex">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="relative z-10 max-w-xl">
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-cyan-500/10 text-cyan-600 shadow-sm">
                <ShieldCheck size={32} />
              </div>
              <p className="section-kicker text-cyan-600">SkillUp Registration</p>
              <h1 className="mt-4 text-5xl font-black tracking-tight text-slate-950 font-outfit">
                Create a learner profile for your batch and placement journey.
              </h1>
              <p className="mt-5 max-w-lg text-xl leading-8 text-slate-500">
                The registration surface follows the same visual hierarchy as RTH, with SkillUp content and cyan accenting.
              </p>

              <div className="mt-12 grid gap-5 sm:grid-cols-2">
                <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <p className="text-3xl font-black text-slate-950">24/7</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-slate-400">Portal access</p>
                </div>
                <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-6 shadow-sm">
                  <p className="text-3xl font-black text-slate-950">1</p>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.35em] text-slate-400">SkillUp profile</p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                  <GraduationCap size={16} className="text-cyan-600" />
                  Batch onboarding
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2">
                  <Sparkles size={16} className="text-cyan-600" />
                  Placement support
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-8 lg:p-10">
            <div className="w-full max-w-xl">
              <div className="mb-6 lg:hidden">
                <p className="section-kicker text-cyan-600">SkillUp registration</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Create your learner profile</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Register here to join a program, then sign in for portal access across learning and exam surfaces.
                </p>
              </div>

              <div className="surface-card rounded-[2.5rem] p-6 sm:p-8">
                <RegisterForm />
              </div>

              <div className="mt-5 flex items-center justify-between rounded-[2rem] border border-slate-200 bg-white/70 px-5 py-4 text-sm text-slate-600 shadow-sm">
                <span>Already registered?</span>
                <Link href="/login" className="font-bold text-cyan-700 transition hover:text-cyan-900">
                  Sign in instead
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
