import type { SessionSnapshot } from "../analytics/session/session-manager";

export function buildChurnFeatures(session: SessionSnapshot) {
  return {
    churn_idle_time_ms: session.idleTimeMs,
    churn_bounce_risk: session.qualityClassification === "bounce",
    churn_engagement_ratio:
      session.engagementTimeMs > 0 ? Number((session.activeTimeMs / session.engagementTimeMs).toFixed(4)) : 0,
  };
}

