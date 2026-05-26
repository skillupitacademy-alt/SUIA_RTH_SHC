import type { AnalyticsEventEnvelope } from "../events";

export function summarizeBehavioralPath(events: AnalyticsEventEnvelope[]) {
  return events.map((event) => event.name);
}

