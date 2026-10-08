import { headers } from 'next/headers';

import { SessionRequestsPanel } from '@/components/session-requests-panel';
import { listFacultySessionRequests } from '@/lib/faculty-live-data';
import { getEffectiveUserId } from '@/lib/request-auth';

export default async function SessionRequestsPage() {
  const requestHeaders = await headers();
  const userId = getEffectiveUserId(requestHeaders);
  const requests = userId === null || userId.length === 0 ? [] : await listFacultySessionRequests(requestHeaders, userId);

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Live sessions</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Pending session requests</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Accept a request, paste a meeting link, and the session accepted event can be published to the notification pipeline.
        </p>
      </div>
      <div className="mt-6">
        <SessionRequestsPanel requests={requests} />
      </div>
    </section>
  );
}
