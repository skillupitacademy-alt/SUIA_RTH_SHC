import { loadConsentState, saveConsentState } from "./consent-storage";
import { defaultConsentState, type ConsentCategory, type ConsentState } from "./privacy-flags";
import { hasTrackingPermission } from "./tracking-permissions";

type ConsentAuditEntry = {
  at: string;
  action: "granted" | "updated" | "revoked";
  state: ConsentState;
};

const auditLog: ConsentAuditEntry[] = [];

export function getConsentState() {
  return loadConsentState();
}

export function updateConsent(partial: Partial<Record<ConsentCategory, boolean>>, region?: ConsentState["region"]) {
  const current = loadConsentState();
  const next: ConsentState = {
    ...current,
    region: region ?? current.region,
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    categories: {
      ...current.categories,
      ...partial,
    },
  };
  saveConsentState(next);
  auditLog.push({
    at: next.updatedAt,
    action: "updated",
    state: next,
  });
  return next;
}

export function revokeConsent() {
  const next: ConsentState = {
    ...defaultConsentState,
    updatedAt: new Date().toISOString(),
  };
  saveConsentState(next);
  auditLog.push({
    at: next.updatedAt,
    action: "revoked",
    state: next,
  });
  return next;
}

export function canDispatchProvider(providerId: string, state = loadConsentState()) {
  if (providerId === "internal") {
    return hasTrackingPermission(state, "functional");
  }
  if (providerId === "ga4" || providerId === "gtm") {
    return hasTrackingPermission(state, "analytics");
  }
  if (providerId === "meta") {
    return hasTrackingPermission(state, "advertising");
  }
  return hasTrackingPermission(state, "marketing");
}

export function getConsentAuditLog() {
  return [...auditLog];
}

