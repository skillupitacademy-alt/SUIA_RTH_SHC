import type { AnalyticsBrandId } from "../../../config/analytics";
import type { AnalyticsEventEnvelope, AnalyticsEventName } from "./events";

export interface FunnelStepDefinition {
  id: string;
  eventName: AnalyticsEventName;
  label: string;
}

export interface FunnelDefinition {
  id: string;
  name: string;
  steps: FunnelStepDefinition[];
}

export interface FunnelProgressRecord {
  brandId: AnalyticsBrandId;
  funnelId: string;
  sessionId: string;
  anonymousId: string;
  completedSteps: string[];
  currentStep?: string;
  completed: boolean;
  lastEventAt: string;
}

const VALID_ANALYTICS_BRANDS = new Set<AnalyticsBrandId>(["realtutorialhub", "skillupitacademy"]);

function assertValidBrandId(brandId: unknown): asserts brandId is AnalyticsBrandId {
  if (typeof brandId !== "string" || !VALID_ANALYTICS_BRANDS.has(brandId as AnalyticsBrandId)) {
    throw new Error("invalid_analytics_brand");
  }
}

export const funnelDefinitions: FunnelDefinition[] = [
  {
    id: "instagram_landing_course_whatsapp_payment",
    name: "Instagram to Payment",
    steps: [
      { id: "landing", eventName: "education.page_viewed", label: "Landing Viewed" },
      { id: "course", eventName: "education.course_viewed", label: "Course Viewed" },
      { id: "lead", eventName: "education.whatsapp_lead_started", label: "WhatsApp Lead" },
      { id: "checkout", eventName: "education.checkout_started", label: "Checkout Started" },
      { id: "payment", eventName: "education.payment_completed", label: "Payment Completed" },
    ],
  },
  {
    id: "youtube_webinar_demo_enrollment",
    name: "YouTube to Enrollment",
    steps: [
      { id: "landing", eventName: "education.page_viewed", label: "Landing Viewed" },
      { id: "video25", eventName: "education.video_progress_25", label: "Video 25%" },
      { id: "video50", eventName: "education.video_progress_50", label: "Video 50%" },
      { id: "demo", eventName: "education.demo_session_booked", label: "Demo Booked" },
      { id: "payment", eventName: "education.payment_completed", label: "Enrollment Completed" },
    ],
  },
  {
    id: "seo_blog_course_signup",
    name: "SEO to Signup",
    steps: [
      { id: "blog", eventName: "education.page_viewed", label: "Blog Entry" },
      { id: "course", eventName: "education.course_viewed", label: "Course Viewed" },
      { id: "lead", eventName: "education.course_enroll_clicked", label: "Signup CTA" },
    ],
  },
];

const funnelStateByBrand = new Map<AnalyticsBrandId, Map<string, FunnelProgressRecord>>();

function getStateKey(funnelId: string, sessionId: string) {
  return JSON.stringify([funnelId, sessionId]);
}

function eventMatchesStep(event: AnalyticsEventEnvelope, step: FunnelStepDefinition) {
  return event.name === step.eventName;
}

export function evaluateFunnelProgress(event: AnalyticsEventEnvelope): FunnelProgressRecord[] {
  const brandId = event?.context?.brandId;
  assertValidBrandId(brandId);

  const sessionId = event?.context?.session?.sessionId;
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    throw new Error("invalid_analytics_session_id");
  }

  const anonymousId = event?.context?.user?.anonymousId;
  if (typeof anonymousId !== "string" || !anonymousId.trim()) {
    throw new Error("invalid_analytics_anonymous_id");
  }

  const matches: FunnelProgressRecord[] = [];

  for (const funnel of funnelDefinitions) {
    const matchingStep = funnel.steps.find((step) => eventMatchesStep(event, step));
    if (!matchingStep) {
      continue;
    }

    let brandFunnelState = funnelStateByBrand.get(brandId);
    if (!brandFunnelState) {
      brandFunnelState = new Map<string, FunnelProgressRecord>();
      funnelStateByBrand.set(brandId, brandFunnelState);
    }

    const key = getStateKey(funnel.id, sessionId);
    const previous = brandFunnelState.get(key);
    const completedSteps = previous ? [...previous.completedSteps] : [];

    if (!completedSteps.includes(matchingStep.id)) {
      completedSteps.push(matchingStep.id);
    }

    const record: FunnelProgressRecord = {
      brandId,
      funnelId: funnel.id,
      sessionId,
      anonymousId,
      completedSteps,
      currentStep: matchingStep.id,
      completed: completedSteps.length === funnel.steps.length,
      lastEventAt: event.context.session.occurredAt,
    };

    brandFunnelState.set(key, record);
    matches.push(record);
  }

  return matches;
}

export function getFunnelState(brandId: AnalyticsBrandId): FunnelProgressRecord[] {
  assertValidBrandId(brandId);
  const brandFunnelState = funnelStateByBrand.get(brandId);
  return brandFunnelState ? [...brandFunnelState.values()] : [];
}
