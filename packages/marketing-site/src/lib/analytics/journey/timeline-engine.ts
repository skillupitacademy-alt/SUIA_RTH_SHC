import type { AnalyticsEventEnvelope } from "../events";

const journeyEvents = new Map<string, AnalyticsEventEnvelope[]>();

export function appendJourneyEvent(identityId: string, event: AnalyticsEventEnvelope) {
  const current = journeyEvents.get(identityId) ?? [];
  journeyEvents.set(identityId, [...current, event]);
}

export function getJourneyTimeline(identityId: string) {
  return (journeyEvents.get(identityId) ?? []).sort(
    (a, b) => Date.parse(a.context.session.occurredAt) - Date.parse(b.context.session.occurredAt),
  );
}

