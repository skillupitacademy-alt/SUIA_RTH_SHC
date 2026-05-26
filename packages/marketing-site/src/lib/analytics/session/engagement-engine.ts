import type { SessionTimeline } from "./session-timeline";

export interface EngagementMetrics {
  engagementTimeMs: number;
  activeTimeMs: number;
  idleTimeMs: number;
  sessionDepth: number;
  interactionDensity: number;
  highIntent: boolean;
}

export function computeEngagementMetrics(timeline: SessionTimeline): EngagementMetrics {
  const started = Date.parse(timeline.startedAt);
  const ended = Date.parse(timeline.lastActivityAt);
  const engagementTimeMs = Math.max(0, ended - started);
  const sessionDepth = timeline.interactions.length;
  const activeTimeMs = Math.round(engagementTimeMs * 0.7);
  const idleTimeMs = Math.max(0, engagementTimeMs - activeTimeMs);
  const interactionDensity = engagementTimeMs > 0 ? sessionDepth / (engagementTimeMs / 60000) : sessionDepth;

  return {
    engagementTimeMs,
    activeTimeMs,
    idleTimeMs,
    sessionDepth,
    interactionDensity,
    highIntent: sessionDepth >= 4 || timeline.interactions.some((item) => item.type === "conversion" || item.type === "lead"),
  };
}

