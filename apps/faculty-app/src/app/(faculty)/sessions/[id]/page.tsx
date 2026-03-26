import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SessionEditForm } from '@/components/session-edit-form';
import { listFacultyUpcomingSessions } from '@/lib/faculty-live-data';

type SessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function FacultySessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');
  const sessions = userId === null || userId.length === 0 ? [] : await listFacultyUpcomingSessions(userId);
  const session = sessions.find((item) => item.id === id);

  if (session === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Sessions</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{session.batchName}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Update the schedule, duration, notes, or status for this live batch session.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{session.studentCount} students</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{session.status}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(session.scheduledAt).toLocaleString()}</span>
        </div>
      </div>

      <SessionEditForm session={session} />

      <div>
        <Link href="/sessions" className="text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
          Back to sessions
        </Link>
      </div>
    </section>
  );
}
