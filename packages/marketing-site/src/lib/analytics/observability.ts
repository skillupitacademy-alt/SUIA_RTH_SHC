import type { AnalyticsEventEnvelope } from "./events";

export interface AnalyticsHealthSnapshot {
  acceptedEvents: number;
  dedupedEvents: number;
  failedEvents: number;
  providerFailures: number;
  validationFailures: number;
  lastEventAt?: string;
}

const snapshot: AnalyticsHealthSnapshot = {
  acceptedEvents: 0,
  dedupedEvents: 0,
  failedEvents: 0,
  providerFailures: 0,
  validationFailures: 0,
};

export function recordAnalyticsAccepted(event: AnalyticsEventEnvelope) {
  snapshot.acceptedEvents += 1;
  snapshot.lastEventAt = event.context.session.occurredAt;
}

export function recordAnalyticsDeduped() {
  snapshot.dedupedEvents += 1;
}

export function recordAnalyticsFailure(type: "provider" | "validation" | "ingest") {
  if (type === "provider") {
    snapshot.providerFailures += 1;
    return;
  }

  if (type === "validation") {
    snapshot.validationFailures += 1;
    return;
  }

  snapshot.failedEvents += 1;
}

export function getAnalyticsHealthSnapshot() {
  return { ...snapshot };
}

