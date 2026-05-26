import { computeEngagementMetrics } from "./engagement-engine";
import { getIdleTimeMs, isSessionInactive } from "./inactivity-detector";
import { computeSessionQuality } from "./quality-scoring";
import { getSessionTimeline, recordSessionInteraction } from "./session-timeline";

export interface SessionSnapshot {
  sessionId: string;
  sessionStart: string;
  sessionEnd?: string;
  active: boolean;
  engagementTimeMs: number;
  activeTimeMs: number;
  idleTimeMs: number;
  sessionDepth: number;
  interactionDensity: number;
  qualityScore: number;
  qualityClassification: "bounce" | "standard" | "engaged" | "high_intent";
}

export function updateSession(input: {
  sessionId: string;
  at: string;
  type: "page" | "click" | "video" | "lead" | "conversion" | "heartbeat";
  path?: string;
}) {
  const timeline = recordSessionInteraction(input.sessionId, {
    at: input.at,
    type: input.type,
    path: input.path,
  });
  const metrics = computeEngagementMetrics(timeline);
  const quality = computeSessionQuality(metrics);

  return {
    sessionId: input.sessionId,
    sessionStart: timeline.startedAt,
    active: !isSessionInactive(timeline.lastActivityAt),
    engagementTimeMs: metrics.engagementTimeMs,
    activeTimeMs: metrics.activeTimeMs,
    idleTimeMs: getIdleTimeMs(timeline.lastActivityAt),
    sessionDepth: metrics.sessionDepth,
    interactionDensity: metrics.interactionDensity,
    qualityScore: quality.score,
    qualityClassification: quality.classification,
  } satisfies SessionSnapshot;
}

export function endSession(sessionId: string): SessionSnapshot | undefined {
  const timeline = getSessionTimeline(sessionId);
  if (!timeline) return undefined;
  const metrics = computeEngagementMetrics(timeline);
  const quality = computeSessionQuality(metrics);

  return {
    sessionId,
    sessionStart: timeline.startedAt,
    sessionEnd: timeline.lastActivityAt,
    active: false,
    engagementTimeMs: metrics.engagementTimeMs,
    activeTimeMs: metrics.activeTimeMs,
    idleTimeMs: metrics.idleTimeMs,
    sessionDepth: metrics.sessionDepth,
    interactionDensity: metrics.interactionDensity,
    qualityScore: quality.score,
    qualityClassification: quality.classification,
  };
}

