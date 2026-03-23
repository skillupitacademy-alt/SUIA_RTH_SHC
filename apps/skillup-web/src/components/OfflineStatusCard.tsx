'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

export function OfflineStatusCard() {
  const [lastVisitedRoute, setLastVisitedRoute] = useState<string | null>(null);

  useEffect(() => {
    setLastVisitedRoute(window.localStorage.getItem('skillup-last-visited-route'));
  }, []);

  const lastVisitedLink = useMemo(() => {
    if (!lastVisitedRoute) return null;
    const label = lastVisitedRoute === '/student' ? 'Student dashboard' : lastVisitedRoute.replace(/^\/+/, '').split('/').join(' / ');
    return { href: lastVisitedRoute, label };
  }, [lastVisitedRoute]);

  return (
    <>
      {lastVisitedLink ? (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-700">Last visited</p>
          <Link href={lastVisitedLink.href} className="mt-2 inline-flex text-sm font-bold text-emerald-900 underline-offset-4 hover:underline">
            Return to {lastVisitedLink.label}
          </Link>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm leading-7 text-slate-600">Open your dashboard again once you are back online.</p>
        </div>
      )}
    </>
  );
}
