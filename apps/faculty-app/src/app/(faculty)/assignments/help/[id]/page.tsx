import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

import { HelpRequestDetailForm } from '@/components/help-request-detail-form';
import { listFacultyHelpRequests } from '@/lib/faculty-live-data';

type HelpRequestPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HelpRequestPage({ params }: HelpRequestPageProps) {
  const { id } = await params;
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const requests = userId === null || userId.length === 0 ? [] : await listFacultyHelpRequests(requestHeaders, userId);
  const request = requests.find((item) => item.id === id);

  if (request === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Assignment help</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{request.subtopic}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{request.question}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{request.studentName}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{request.status}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(request.requestedAt).toLocaleString()}</span>
        </div>
      </div>

      <HelpRequestDetailForm request={request} />

      <div>
        <Link href="/assignments/help" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
          Back to help requests
        </Link>
      </div>
    </section>
  );
}
