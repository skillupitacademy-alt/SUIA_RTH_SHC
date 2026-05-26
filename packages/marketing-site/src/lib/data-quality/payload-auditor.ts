import type { AnalyticsEventEnvelope } from "../analytics/events";

export function auditPayload(event: AnalyticsEventEnvelope) {
  const payloadSize = JSON.stringify(event.payload).length;
  return {
    payloadSize,
    oversized: payloadSize > 4096,
    hasCourseContext: Boolean(event.payload.courseName || event.payload.courseSlug),
  };
}

