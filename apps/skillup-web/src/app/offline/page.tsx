import type { Metadata } from 'next';

import { OfflineStatusCard } from '@/components/OfflineStatusCard';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'Offline fallback for the SkillUp IT Academy student portal.',
};

export default function OfflinePage() {
  return (
    <main className="surface-shell min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
        <section className="surface-panel w-full rounded-[3rem] p-8 lg:p-10">
          <p className="section-kicker text-cyan-600">Offline mode</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 font-outfit">Your training dashboard is unavailable offline</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">Reconnect to continue with batches, attendance, payments, and placement data.</p>
        <OfflineStatusCard />
        </section>
      </div>
    </main>
  );
}
