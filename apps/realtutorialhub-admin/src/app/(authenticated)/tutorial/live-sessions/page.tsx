import { Radio } from 'lucide-react';

import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader';
import { LiveSessionRequestsBoard } from '@/components/tutorial/LiveSessionRequestsBoard';

export default function TutorialLiveSessionsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Tutorial Live Sessions"
        description="Review pending student requests and schedule live help sessions."
        icon={<Radio className="text-sky-500 animate-pulse" size={20} />}
      />

      <LiveSessionRequestsBoard />
    </div>
  );
}
