import type { AnalyticsBrandId } from "../../config/analytics";
import type { AnalyticsEventEnvelope, AnalyticsEventName } from "./events";

export type LeadTemperature = "cold" | "warm" | "hot";

export interface LeadScoreSnapshot {
  brandId: AnalyticsBrandId;
  anonymousId: string;
  sessionId: string;
  score: number;
  temperature: LeadTemperature;
  segments: string[];
  lastEventAt: string;
}

const VALID_ANALYTICS_BRANDS = new Set<AnalyticsBrandId>(["realtutorialhub", "skillupitacademy"]);

function assertValidBrandId(brandId: unknown): asserts brandId is AnalyticsBrandId {
  if (typeof brandId !== "string" || !VALID_ANALYTICS_BRANDS.has(brandId as AnalyticsBrandId)) {
    throw new Error("invalid_analytics_brand");
  }
}

const scoreWeights: Record<AnalyticsEventName, number> = {
  "education.course_viewed": 5,
  "education.course_enroll_clicked": 15,
  "education.checkout_started": 30,
  "education.payment_completed": 50,
  "education.lesson_completed": 10,
  "education.video_progress_25": 6,
  "education.video_progress_50": 10,
  "education.video_progress_75": 14,
  "education.certificate_generated": 12,
  "education.whatsapp_lead_started": 20,
  "education.demo_session_booked": 25,
  "education.referral_shared": 8,
  "education.page_viewed": 2,
};

const scoreStateByBrand = new Map<AnalyticsBrandId, Map<string, LeadScoreSnapshot>>();

function getTemperature(score: number): LeadTemperature {
  if (score >= 60) {
    return "hot";
  }

  if (score >= 25) {
    return "warm";
  }

  return "cold";
}

function deriveSegments(event: AnalyticsEventEnvelope, score: number): string[] {
  const segments = new Set<string>();

  if (event.payload.courseCategory) {
    segments.add(`interest:${event.payload.courseCategory.toLowerCase()}`);
  }

  if (event.context.attribution?.source) {
    segments.add(`source:${event.context.attribution.source.toLowerCase()}`);
  }

  if (score >= 60) {
    segments.add("intent:high");
  } else if (score >= 25) {
    segments.add("intent:medium");
  } else {
    segments.add("intent:low");
  }

  return [...segments];
}

export function updateLeadScore(event: AnalyticsEventEnvelope): LeadScoreSnapshot {
  const brandId = event?.context?.brandId;
  assertValidBrandId(brandId);

  const key = event?.context?.user?.anonymousId;
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("invalid_analytics_anonymous_id");
  }

  if (!event?.name || !(event.name in scoreWeights)) {
    throw new Error("invalid_analytics_event_name");
  }

  let brandScores = scoreStateByBrand.get(brandId);
  if (!brandScores) {
    brandScores = new Map<string, LeadScoreSnapshot>();
    scoreStateByBrand.set(brandId, brandScores);
  }

  const previous = brandScores.get(key);
  const score = (previous?.score ?? 0) + scoreWeights[event.name];
  const snapshot: LeadScoreSnapshot = {
    brandId,
    anonymousId: key,
    sessionId: event.context.session.sessionId,
    score,
    temperature: getTemperature(score),
    segments: deriveSegments(event, score),
    lastEventAt: event.context.session.occurredAt,
  };

  brandScores.set(key, snapshot);
  return snapshot;
}

export function getLeadScores(brandId: AnalyticsBrandId): LeadScoreSnapshot[] {
  assertValidBrandId(brandId);
  const brandScores = scoreStateByBrand.get(brandId);
  return brandScores ? [...brandScores.values()] : [];
}
