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
  funnelId: string;
  sessionId: string;
  anonymousId: string;
  completedSteps: string[];
  currentStep?: string;
  completed: boolean;
  lastEventAt: string;
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

const funnelState = new Map<string, FunnelProgressRecord>();

function getStateKey(funnelId: string, sessionId: string) {
  return `${funnelId}:${sessionId}`;
}

function eventMatchesStep(event: AnalyticsEventEnvelope, step: FunnelStepDefinition) {
  return event.name === step.eventName;
}

export function evaluateFunnelProgress(event: AnalyticsEventEnvelope): FunnelProgressRecord[] {
  const matches: FunnelProgressRecord[] = [];

  for (const funnel of funnelDefinitions) {
    const matchingStep = funnel.steps.find((step) => eventMatchesStep(event, step));
    if (!matchingStep) {
      continue;
    }

    const key = getStateKey(funnel.id, event.context.session.sessionId);
    const previous = funnelState.get(key);
    const completedSteps = previous ? [...previous.completedSteps] : [];

    if (!completedSteps.includes(matchingStep.id)) {
      completedSteps.push(matchingStep.id);
    }

    const record: FunnelProgressRecord = {
      funnelId: funnel.id,
      sessionId: event.context.session.sessionId,
      anonymousId: event.context.user.anonymousId,
      completedSteps,
      currentStep: matchingStep.id,
      completed: completedSteps.length === funnel.steps.length,
      lastEventAt: event.context.session.occurredAt,
    };

    funnelState.set(key, record);
    matches.push(record);
  }

  return matches;
}

export function getFunnelState() {
  return [...funnelState.values()];
}

