import type { EngagementMetrics } from "./engagement-engine";

export interface SessionQuality {
  score: number;
  classification: "bounce" | "standard" | "engaged" | "high_intent";
}

export function computeSessionQuality(metrics: EngagementMetrics): SessionQuality {
  const score = Math.min(
    100,
    Math.round(metrics.sessionDepth * 10 + metrics.interactionDensity * 8 + (metrics.highIntent ? 25 : 0)),
  );

  if (score < 20) {
    return { score, classification: "bounce" };
  }

  if (score < 45) {
    return { score, classification: "standard" };
  }

  if (score < 70) {
    return { score, classification: "engaged" };
  }

  return { score, classification: "high_intent" };
}

