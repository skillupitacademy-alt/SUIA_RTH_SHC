import type { AnalyticsEventEnvelope } from "../analytics/events";

export function validateWarehouseReadyEvent(event: AnalyticsEventEnvelope) {
  return {
    valid: Boolean(event.context.brandId && event.context.session.sessionId && event.context.user.anonymousId),
    missingFields: [
      !event.context.brandId ? "brandId" : undefined,
      !event.context.session.sessionId ? "sessionId" : undefined,
      !event.context.user.anonymousId ? "anonymousId" : undefined,
    ].filter(Boolean),
  };
}

