import type { AnalyticsEventEnvelope } from "../events";
import type { JourneyGraph } from "./graph-model";
import { summarizeBehavioralPath } from "./behavioral-paths";
import { appendJourneyEvent, getJourneyTimeline } from "./timeline-engine";

export function addJourneyEvent(identityId: string, event: AnalyticsEventEnvelope) {
  appendJourneyEvent(identityId, event);
  return getJourneyTimeline(identityId);
}

export function buildJourneyGraph(identityId: string): JourneyGraph {
  const events = getJourneyTimeline(identityId);
  const nodes = events.map((event, index) => ({
    id: `${identityId}_${index}`,
    label: event.name,
    kind: event.name === "education.payment_completed" ? "conversion" : "event",
  })) satisfies JourneyGraph["nodes"];

  const edges = events.slice(1).map((event, index) => ({
    source: `${identityId}_${index}`,
    target: `${identityId}_${index + 1}`,
    count: 1,
  }));

  return { nodes, edges };
}

export function buildSankeyExport(identityId: string) {
  const events = getJourneyTimeline(identityId);
  return {
    path: summarizeBehavioralPath(events),
    graph: buildJourneyGraph(identityId),
  };
}

