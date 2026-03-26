import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AttendanceBoard } from '@/components/attendance-board';
import { listFacultyBatches, listFacultyUpcomingSessions } from '@/lib/faculty-live-data';

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ batchId: string; sessionId: string }>;
}) {
  const { batchId, sessionId } = await params;
  const requestHeaders = await headers();
  const userId = requestHeaders.get('x-user-id');

  if (userId === null || userId.length === 0) {
    notFound();
  }

  const [batches, sessions] = await Promise.all([listFacultyBatches(userId), listFacultyUpcomingSessions(userId)]);
  const batch = batches.find((item) => item.id === batchId);
  const session = sessions.find((item) => item.id === sessionId && item.batchId === batchId);

  if (batch === undefined || session === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Attendance</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{batch.name}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Mark attendance for the selected batch session. Use the session edit page if the timing or notes need to change.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm font-semibold text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">{batch.track}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{session.status}</span>
          <span className="rounded-full bg-slate-100 px-3 py-1">{new Date(session.scheduledAt).toLocaleString()}</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={`/my-batches/${batch.id}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Batch detail
          </Link>
          <Link
            href={`/sessions/${session.id}`}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
          >
            Edit session
          </Link>
        </div>
      </div>

      <AttendanceBoard batchId={batchId} sessionId={sessionId} />
    </section>
  );
}
