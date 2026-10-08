import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { LiveSessionRequestDetail } from '@/components/tutorial/LiveSessionRequestDetail';

export default async function TutorialLiveSessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Live Session Request"
        description="Accept and schedule the selected tutorial request."
        icon={<ArrowLeft className="text-sky-500" size={20} />}
      />

      <Link href="/tutorial/live-sessions" className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
        Back to requests
      </Link>

      <LiveSessionRequestDetail requestId={id} />
    </div>
  );
}
