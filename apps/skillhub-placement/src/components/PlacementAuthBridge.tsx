'use client';

import { useState, useTransition } from 'react';

import {
  getPlacementLaunchUrl,
  getPlacementLoginUrl,
  getPlacementRefreshUrl,
  type PlacementBrand,
} from '@/lib/brand';

type PlacementAuthBridgeProps = {
  brand: PlacementBrand;
  redirectPath: string;
  buttonClass: string;
};

type RefreshPayload = {
  accessToken?: string;
};

export function PlacementAuthBridge({ brand, redirectPath, buttonClass }: PlacementAuthBridgeProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleContinue() {
    setError(null);

    startTransition(async () => {
      try {
        const refreshResponse = await fetch(getPlacementRefreshUrl(brand), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
            'x-portal-identity': 'user',
          },
          body: JSON.stringify({}),
        });

        const refreshPayload = (await refreshResponse.json().catch(() => null)) as RefreshPayload | null;

        if (refreshResponse.ok === false || typeof refreshPayload?.accessToken !== 'string' || refreshPayload.accessToken.trim().length === 0) {
          window.location.assign(getPlacementLoginUrl(brand, `/placement?redirect=${encodeURIComponent(redirectPath)}`));
          return;
        }

        const handoffResponse = await fetch('/api/auth/handoff', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: refreshPayload.accessToken,
            redirectTo: redirectPath,
          }),
        });

        if (handoffResponse.ok === false) {
          throw new Error('Shared placement sign-in handoff failed.');
        }

        window.location.assign(redirectPath);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Shared placement sign-in failed.');
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleContinue} disabled={isPending} className={`rounded-full px-5 py-3 text-sm font-black transition disabled:opacity-60 ${buttonClass}`}>
          {isPending ? `Continuing with ${brand === 'realtutorialhub' ? 'RTH' : 'SkillUp'}...` : `Continue with ${brand === 'realtutorialhub' ? 'RTH' : 'SkillUp'} session`}
        </button>
        <a
          href={getPlacementLaunchUrl(brand, redirectPath)}
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Open via brand host
        </a>
      </div>
      {error !== null ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
