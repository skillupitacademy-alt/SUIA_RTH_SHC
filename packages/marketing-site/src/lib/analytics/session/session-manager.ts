import type { AnalyticsBrandId } from "../../../config/analytics";
import { computeEngagementMetrics } from "./engagement-engine";
import { getIdleTimeMs, isSessionInactive } from "./inactivity-detector";
import { computeSessionQuality } from "./quality-scoring";
import { getSessionTimeline, recordSessionInteraction } from "./session-timeline";

export interface SessionSnapshot {
  brandId: AnalyticsBrandId;
  sessionId: string;
  sessionStart: string;
  sessionEnd?: string;
  active: boolean;
  engagementTimeMs: number;
  activeTimeMs: number;
  idleTimeMs: number;
  sessionDepth: number;
  interactionDensity: number;
  qualityScore: number;
  qualityClassification: "bounce" | "standard" | "engaged" | "high_intent";
}

export interface SessionUpdateInput {
  brandId: AnalyticsBrandId;
  sessionId: string;
  at: string;
  type: "page" | "click" | "video" | "lead" | "conversion" | "heartbeat";
  path?: string;
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

export function updateSession(input: SessionUpdateInput): SessionSnapshot;
export function updateSession(
  brandId: AnalyticsBrandId,
  input: Omit<SessionUpdateInput, "brandId">,
): SessionSnapshot;
/** @deprecated Unscoped session updates are rejected at runtime; callers must supply brandId. */
export function updateSession(
  input: Omit<SessionUpdateInput, "brandId"> & { brandId?: AnalyticsBrandId },
): SessionSnapshot;
export function updateSession(
  first: SessionUpdateInput | (Omit<SessionUpdateInput, "brandId"> & { brandId?: AnalyticsBrandId }) | AnalyticsBrandId,
  second?: Omit<SessionUpdateInput, "brandId">,
): SessionSnapshot {
  const resolvedInput =
    typeof first === "string"
      ? { ...(second as Omit<SessionUpdateInput, "brandId">), brandId: first }
      : first;

  const brandId = resolvedInput?.brandId;
  assertValidBrandId(brandId);

  const timeline = recordSessionInteraction(brandId, resolvedInput.sessionId, {
    at: resolvedInput.at,
    type: resolvedInput.type,
    path: resolvedInput.path,
  });
  const metrics = computeEngagementMetrics(timeline);
  const quality = computeSessionQuality(metrics);

  return {
    brandId,
    sessionId: resolvedInput.sessionId,
    sessionStart: timeline.startedAt,
    active: !isSessionInactive(timeline.lastActivityAt),
    engagementTimeMs: metrics.engagementTimeMs,
    activeTimeMs: metrics.activeTimeMs,
    idleTimeMs: getIdleTimeMs(timeline.lastActivityAt),
    sessionDepth: metrics.sessionDepth,
    interactionDensity: metrics.interactionDensity,
    qualityScore: quality.score,
    qualityClassification: quality.classification,
  } satisfies SessionSnapshot;
}

export function endSession(brandId: AnalyticsBrandId, sessionId: string): SessionSnapshot | undefined;
export function endSession(sessionId: string, brandId: AnalyticsBrandId): SessionSnapshot | undefined;
export function endSession(first: string, second: string): SessionSnapshot | undefined {
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
  const timeline = getSessionTimeline(brandId, sessionId as string);
  if (!timeline) return undefined;
  const metrics = computeEngagementMetrics(timeline);
  const quality = computeSessionQuality(metrics);

  return {
    brandId,
    sessionId: sessionId as string,
    sessionStart: timeline.startedAt,
    sessionEnd: timeline.lastActivityAt,
    active: false,
    engagementTimeMs: metrics.engagementTimeMs,
    activeTimeMs: metrics.activeTimeMs,
    idleTimeMs: metrics.idleTimeMs,
    sessionDepth: metrics.sessionDepth,
    interactionDensity: metrics.interactionDensity,
    qualityScore: quality.score,
    qualityClassification: quality.classification,
  };
}
