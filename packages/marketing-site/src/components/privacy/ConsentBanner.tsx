"use client";

import { useEffect, useState } from "react";

import { getConsentState, revokeConsent, updateConsent } from "../../lib/privacy/consent-manager";
import type { ConsentState } from "../../lib/privacy/privacy-flags";

export function ConsentBanner() {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsent(getConsentState());
  }, []);

  if (!consent || consent.categories.analytics || consent.categories.advertising) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] rounded-2xl border border-black/10 bg-white p-4 shadow-2xl md:left-auto md:max-w-xl">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Privacy Preferences</p>
          <p className="text-sm text-slate-600">
            Choose how analytics and advertising providers can process your learning journey data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={() => setConsent(updateConsent({ analytics: true, marketing: true, advertising: true }))}
          >
            Accept All
          </button>
          <button
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900"
            onClick={() => setConsent(updateConsent({ analytics: true, marketing: false, advertising: false }))}
          >
            Analytics Only
          </button>
          <button
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900"
            onClick={() => setConsent(revokeConsent())}
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
}

