import type { Metadata } from 'next';
import Link from 'next/link';

import { fetchSkillupCertificateVerification } from '@/lib/certificate-verification';

type VerifyPageProps = {
  params: Promise<{ code: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Verify ${code}`,
    description: 'Public certificate verification for SkillUp IT Academy.',
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;
  const verification = await fetchSkillupCertificateVerification(code);
  const isVerified = verification.status === 'verified';
  const isExpired = verification.status === 'expired';
  const isUnavailable = verification.status === 'unavailable';
  const title = isVerified ? 'Verified' : isExpired ? 'Expired' : isUnavailable ? 'Unavailable' : 'Not found';
  const panelClassName = isVerified
    ? 'border-emerald-200 bg-emerald-50'
    : isExpired
      ? 'border-amber-200 bg-amber-50'
      : isUnavailable
        ? 'border-slate-200 bg-slate-50'
        : 'border-rose-200 bg-rose-50';
  const toneClassName = isVerified
    ? 'text-emerald-800'
    : isExpired
      ? 'text-amber-800'
      : isUnavailable
        ? 'text-slate-700'
        : 'text-rose-800';
  const bodyClassName = isVerified
    ? 'text-emerald-900'
    : isExpired
      ? 'text-amber-900'
      : isUnavailable
        ? 'text-slate-700'
        : 'text-rose-900';

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Public verification</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Certificate verification</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Verification code <span className="font-semibold text-slate-900">{code}</span> was checked against the public certificate surface.
        </p>
        <div className={`mt-6 rounded-3xl border p-5 ${panelClassName}`}>
          <p className={`text-sm font-semibold ${toneClassName}`}>{title}</p>
          <p className={`mt-2 text-sm leading-6 ${bodyClassName}`}>
            {isVerified && verification.certificate !== null
              ? `Issued by ${verification.certificate.parentName} for the ${verification.certificate.scope} scope.`
              : isExpired && verification.certificate !== null
                ? `This certificate is on record but has expired. Issued by ${verification.certificate.parentName}.`
                : isUnavailable
                  ? 'The verification service could not be reached right now. Please try again shortly.'
                  : 'No certificate record was found for this verification code.'}
          </p>
          {verification.certificate !== null ? (
            <dl className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Parent</dt>
                <dd className="mt-1 font-semibold text-slate-950">{verification.certificate.parentName}</dd>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Scope</dt>
                <dd className="mt-1 font-semibold text-slate-950">{verification.certificate.scope}</dd>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Issued</dt>
                <dd className="mt-1 font-semibold text-slate-950">{new Date(verification.certificate.issuedAt).toLocaleDateString('en-IN')}</dd>
              </div>
              <div className="rounded-2xl bg-white/70 p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Version</dt>
                <dd className="mt-1 font-semibold text-slate-950">v{verification.certificate.version}</dd>
              </div>
            </dl>
          ) : null}
        </div>
        <Link href="/" className="mt-6 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
          Back to home
        </Link>
      </section>
    </main>
  );
}
