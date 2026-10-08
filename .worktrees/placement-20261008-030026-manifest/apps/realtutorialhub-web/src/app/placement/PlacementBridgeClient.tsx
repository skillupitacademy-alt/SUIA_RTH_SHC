'use client';

import { useEffect, useState } from 'react';

type PlacementBridgeClientProps = {
  redirectTarget: string;
};

function getPlacementUrl(redirectTarget: string) {
  return `https://placement.skillhubcore.in${redirectTarget}`;
}

export function PlacementBridgeClient({ redirectTarget }: PlacementBridgeClientProps) {
  const [message, setMessage] = useState('Connecting your Real Tutorial Hub session to shared placement...');

  useEffect(() => {
    let isMounted = true;

    async function run() {
      try {
        const handoffResponse = await fetch('/api/auth/placement-handoff', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-portal-identity': 'user',
            'x-brand': 'realtutorialhub',
          },
          body: JSON.stringify({
            redirectTo: redirectTarget,
          }),
        });

        if (handoffResponse.ok === false) {
          window.location.replace(`/login?redirect=${encodeURIComponent(`/placement?redirect=${encodeURIComponent(redirectTarget)}`)}`);
          return;
        }

        window.location.replace(getPlacementUrl(redirectTarget));
      } catch (cause) {
        if (isMounted) {
          setMessage(cause instanceof Error ? cause.message : 'Unable to continue into shared placement.');
        }
      }
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, [redirectTarget]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,75,145,0.16),transparent_28%),linear-gradient(180deg,#fff7fb_0%,#ffffff_58%)] px-6 py-10">
      <div className="mx-auto max-w-2xl rounded-[36px] border border-rose-100 bg-white p-8 text-center shadow-[0_30px_80px_rgba(255,75,145,0.12)] sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.35em] text-rose-500">Placement Bridge</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950">Continuing to shared placement</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">{message}</p>
      </div>
    </main>
  );
}
