import type { SessionSnapshot } from "../analytics/session/session-manager";

export function buildRetentionFeatures(session: SessionSnapshot) {
  return {
    retention_session_depth: session.sessionDepth,
    retention_quality_score: session.qualityScore,
    retention_active_time_ms: session.activeTimeMs,
  };
}

