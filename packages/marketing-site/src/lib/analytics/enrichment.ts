import type { AnalyticsEventContext, AnalyticsEventEnvelope, AnalyticsEventName, AnalyticsEventPayload } from "./events";

export interface EnrichmentInput<TEvent extends AnalyticsEventName> {
  name: TEvent;
  payload: AnalyticsEventPayload<TEvent>;
  context: AnalyticsEventContext;
}

function getDeviceLabel(context: AnalyticsEventContext) {
  return context.device?.type ?? "unknown";
}

function getTrafficSource(context: AnalyticsEventContext) {
  return context.attribution?.source ?? "direct";
}

export function enrichAnalyticsEvent<TEvent extends AnalyticsEventName>(
  input: EnrichmentInput<TEvent>,
): AnalyticsEventEnvelope<TEvent> {
  return {
    name: input.name,
    payload: input.payload,
    context: {
      ...input.context,
      metadata: {
        ...input.context.metadata,
        domain: input.context.page?.hostname ?? "unknown",
        traffic_source: getTrafficSource(input.context),
        utm_campaign: input.context.attribution?.campaign ?? null,
        utm_medium: input.context.attribution?.medium ?? null,
        utm_source: input.context.attribution?.source ?? null,
        referrer: input.context.page?.referrer ?? null,
        device_type: getDeviceLabel(input.context),
        user_segment: input.context.user.segment ?? "anonymous",
        logged_in_state: input.context.user.loggedInState,
        lead_score: input.context.user.leadScore ?? null,
        student_stage: input.context.user.studentStage ?? null,
        course_name: input.payload.courseName ?? null,
        course_slug: input.payload.courseSlug ?? null,
        instructor: input.payload.instructor ?? null,
        pricing: input.payload.value ?? null,
        discount: null,
      },
    },
  };
}

