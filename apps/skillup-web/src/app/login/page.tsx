import Link from 'next/link';
import { Suspense } from 'react';

import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login',
  description: 'Sign in to the SkillUp IT Academy student portal.',
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl items-center px-6 py-10">
      <section className="glass-morphism w-full rounded-[2.5rem] p-8 shadow-[0_24px_120px_rgba(15,23,42,0.08)]">
        <p className="eyebrow-label text-cyan-600">SkillUp login</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Student Portal</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Enter your credentials to access the learning, attendance, and placement surfaces.
        </p>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white/60 p-6 backdrop-blur-sm">
            <Suspense fallback={<div className="h-[260px] animate-pulse rounded-[1.5rem] bg-slate-100" />}>
              <LoginForm />
            </Suspense>
          </div>

          <aside className="platform-card">
            <p className="eyebrow-label text-slate-500">Need an account?</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use the registration surface to create a student profile, then sign in with your credentials.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Go to registration
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
