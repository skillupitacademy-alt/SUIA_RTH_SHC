import type { AnalyticsEventEnvelope } from "../analytics/events";

export function checkCompleteness(event: AnalyticsEventEnvelope) {
  return {
    hasAttribution: Boolean(event.context.attribution?.source),
    hasPageContext: Boolean(event.context.page?.path),
    hasUserContext: Boolean(event.context.user.anonymousId),
  };
}

