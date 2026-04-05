'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { resolveSharedLoginBrand } from '@quiz/config/src/brands';

import { getTutorialPortalBrandDefinition, withTutorialPortalBrand } from '@/lib/portal-brand';

export default function VerifySuccessPage() {
  const searchParams = useSearchParams();
  const portalBrand = resolveSharedLoginBrand(searchParams.get('brand'));
  const brandDefinition = getTutorialPortalBrandDefinition(portalBrand);
  const accentColor = portalBrand === 'skillup' ? '#f54a8d' : '#fb4b91';

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_30%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[32px] border border-rose-100 bg-white p-10 shadow-[0_30px_80px_rgba(255,75,145,0.12)]">
        <p className="text-sm font-bold uppercase tracking-[0.35em]" style={{ color: accentColor }}>{brandDefinition.brandName} Access Ready</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Email verified</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          {portalBrand === 'skillup'
            ? 'Your SkillUp account is active. Sign in to continue with the shared tutorial engine under the correct brand identity.'
            : 'Your Real Tutorial Hub account is active. Sign in to continue with quizzes, AI tutor sessions, and your learning path.'}
        </p>
        <div className="mt-8 flex gap-3">
          <Link href={withTutorialPortalBrand('/login', portalBrand)} className="rounded-full bg-rose-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-rose-600">
            Continue to login
          </Link>
          <Link href="/" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-700">
            Open portal
          </Link>
        </div>
      </div>
    </main>
  );
}
