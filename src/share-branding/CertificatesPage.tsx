import Link from 'next/link';

import { BrandConfig } from './brandConfig';

interface CertificatesPageProps {
  brand: BrandConfig;
}

export default function CertificatesPage({ brand }: CertificatesPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: brand.primaryColor }}>
            {brand.name}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Certificates</h1>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">No certificates available yet</h2>
          <p className="mt-2 text-sm text-slate-600">
            Completed certificates will appear here after eligible learning or assessment workflows are issued.
          </p>
          <Link
            className="mt-5 inline-flex rounded-md px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.primaryColor }}
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </section>
      </div>
    </main>
  );
}
