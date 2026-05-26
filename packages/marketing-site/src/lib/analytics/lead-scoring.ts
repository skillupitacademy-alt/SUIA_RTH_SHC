import type { AnalyticsEventEnvelope, AnalyticsEventName } from "./events";

export type LeadTemperature = "cold" | "warm" | "hot";

export interface LeadScoreSnapshot {
  anonymousId: string;
  sessionId: string;
  score: number;
  temperature: LeadTemperature;
  segments: string[];
  lastEventAt: string;
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

const scoreState = new Map<string, LeadScoreSnapshot>();

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
  const key = event.context.user.anonymousId;
  const previous = scoreState.get(key);
  const score = (previous?.score ?? 0) + scoreWeights[event.name];
  const snapshot: LeadScoreSnapshot = {
    anonymousId: key,
    sessionId: event.context.session.sessionId,
    score,
    temperature: getTemperature(score),
    segments: deriveSegments(event, score),
    lastEventAt: event.context.session.occurredAt,
  };

  scoreState.set(key, snapshot);
  return snapshot;
}

export function getLeadScores() {
  return [...scoreState.values()];
}

