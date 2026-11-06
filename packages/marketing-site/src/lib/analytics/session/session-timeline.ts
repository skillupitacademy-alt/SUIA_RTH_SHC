import type { AnalyticsBrandId } from "../../../../config/analytics";

export interface SessionInteraction {
  at: string;
  type: "page" | "click" | "video" | "lead" | "conversion" | "heartbeat";
  path?: string;
}

export interface SessionTimeline {
  brandId: AnalyticsBrandId;
  sessionId: string;
  startedAt: string;
  lastActivityAt: string;
  interactions: SessionInteraction[];
}

const VALID_ANALYTICS_BRANDS = new Set<AnalyticsBrandId>(["realtutorialhub", "skillupitacademy"]);

function isValidBrandId(value: unknown): value is AnalyticsBrandId {
  return typeof value === "string" && VALID_ANALYTICS_BRANDS.has(value as AnalyticsBrandId);
}

function assertValidBrandId(brandId: unknown): asserts brandId is AnalyticsBrandId {
  if (!isValidBrandId(brandId)) {
    throw new Error("invalid_analytics_brand");
  }
}

function assertValidSessionId(sessionId: unknown): asserts sessionId is string {
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    throw new Error("invalid_analytics_session_id");
  }
}

const timelinesByBrand = new Map<AnalyticsBrandId, Map<string, SessionTimeline>>();

export function recordSessionInteraction(
  brandId: AnalyticsBrandId,
  sessionId: string,
  interaction: SessionInteraction,
): SessionTimeline;
export function recordSessionInteraction(
  sessionId: string,
  interaction: SessionInteraction,
  brandId: AnalyticsBrandId,
): SessionTimeline;
export function recordSessionInteraction(
  first: AnalyticsBrandId | string,
  second: string | SessionInteraction,
  third?: SessionInteraction | AnalyticsBrandId,
): SessionTimeline {
  let brandId: unknown;
  let sessionId: unknown;
  let interaction: SessionInteraction | undefined;

  if (typeof second === "string") {
    brandId = first;
    sessionId = second;
    interaction = third as SessionInteraction | undefined;
  } else {
    sessionId = first;
    interaction = second;
    brandId = third;
  }

  assertValidBrandId(brandId);
  assertValidSessionId(sessionId);
  if (!interaction || typeof interaction.at !== "string" || !interaction.at.trim()) {
    throw new Error("invalid_analytics_session_interaction");
  }

  let brandTimelines = timelinesByBrand.get(brandId);
  if (!brandTimelines) {
    brandTimelines = new Map<string, SessionTimeline>();
    timelinesByBrand.set(brandId, brandTimelines);
  }

  const existing = brandTimelines.get(sessionId);
  const timeline: SessionTimeline = existing
    ? {
      ...existing,
      lastActivityAt: interaction.at,
      interactions: [...existing.interactions, interaction],
    }
    : {
      brandId,
      sessionId,
      startedAt: interaction.at,
      lastActivityAt: interaction.at,
      interactions: [interaction],
    };

  brandTimelines.set(sessionId, timeline);
  return timeline;
}

export function getSessionTimeline(brandId: AnalyticsBrandId, sessionId: string): SessionTimeline | undefined;
export function getSessionTimeline(sessionId: string, brandId: AnalyticsBrandId): SessionTimeline | undefined;
export function getSessionTimeline(first: string, second: string): SessionTimeline | undefined {
  let brandId: unknown;
  let sessionId: unknown;

  if (isValidBrandId(first) && !isValidBrandId(second)) {
    brandId = first;
    sessionId = second;
  } else if (isValidBrandId(second) && !isValidBrandId(first)) {
    sessionId = first;
    brandId = second;
  } else {
    brandId = first;
    sessionId = second;
  }

  assertValidBrandId(brandId);
  assertValidSessionId(sessionId);

  return timelinesByBrand.get(brandId)?.get(sessionId);
}
