import { AttendanceBoard } from '@/components/attendance-board';

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ batchId: string; sessionId: string }>;
}) {
  const { batchId, sessionId } = await params;

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <AttendanceBoard batchId={batchId} sessionId={sessionId} />
    </section>
  );
}
