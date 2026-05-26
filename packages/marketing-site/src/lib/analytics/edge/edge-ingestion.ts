import type { AnalyticsEventEnvelope } from "../events";

export function filterEdgeBot(userAgent?: string) {
  return /bot|crawler|spider|headless/i.test(userAgent ?? "");
}

export function validateEdgePayload(event: AnalyticsEventEnvelope) {
  return Boolean(event.name && event.context.session.sessionId && event.context.user.anonymousId);
}

export function resolveRegionalRoute(regionHint?: string) {
  if (regionHint?.toLowerCase().startsWith("eu")) return "eu";
  if (regionHint?.toLowerCase().startsWith("in")) return "in";
  return "global";
}

