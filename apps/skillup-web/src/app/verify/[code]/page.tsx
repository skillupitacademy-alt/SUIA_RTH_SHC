import type { Metadata } from 'next';
import Link from 'next/link';

type VerifyPageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: VerifyPageProps): Promise<Metadata> {
  const { code } = await params;

  return {
    title: `Verify ${code}`,
    description: 'Public certificate verification for SkillUp IT Academy.',
  };
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { code } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Public verification</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Certificate verification</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Verification code <span className="font-semibold text-slate-900">{code}</span> was checked against the public certificate surface.
        </p>
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-800">Verified</p>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            This placeholder page demonstrates the public certificate verification flow while the service integration is wired up.
          </p>
        </div>
        <Link href="/" className="mt-6 inline-flex rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
          Back to home
        </Link>
      </section>
    </main>
  );
}
