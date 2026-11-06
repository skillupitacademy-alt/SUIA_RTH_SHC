import { createHash } from "node:crypto";

import type { AnalyticsBrandId } from "../../../../config/analytics";
import { addIdentityEdge, calculateDeterministicConfidence, calculateProbabilisticConfidence } from "./identity-graph";
import { findIdentityNode, saveIdentityNode, type IdentityNode } from "./identity-store";
import { mergeIdentityNodes } from "./user-merge-engine";

export interface IdentityResolutionInput {
  brandId: AnalyticsBrandId;
  anonymousId: string;
  sessionId: string;
  userId?: string;
  crmId?: string;
  leadId?: string;
  deviceId?: string;
  email?: string;
  phone?: string;
  userAgent?: string;
  locale?: string;
  campaignId?: string;
}

export interface ResolvedIdentity {
  node: IdentityNode;
  matchType: "anonymous" | "deterministic" | "probabilistic" | "merged";
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

function secureHash(value?: string) {
  if (!value) {
    return undefined;
  }

  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function linkBrandScopedAnonymousIdentity(input: {
  brandId: AnalyticsBrandId;
  anonymousId: string;
  sessionId: string;
  deviceId?: string;
}): IdentityNode {
  const existing = findIdentityNode(input.brandId, "anonymous_id", input.anonymousId);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const node: IdentityNode = {
    id: `identity:${input.brandId}:${input.anonymousId}`,
    brandId: input.brandId,
    identifiers: {
      anonymous_id: input.anonymousId,
      session_id: input.sessionId,
      device_id: input.deviceId,
    },
    confidence: 0.3,
    createdAt: now,
    updatedAt: now,
  };

  saveIdentityNode(input.brandId, node);
  addIdentityEdge({
    from: node.id,
    to: node.id,
    relation: "same_device",
    confidence: 0.3,
    createdAt: now,
  });
  return node;
}

export function resolveIdentity(input: IdentityResolutionInput): ResolvedIdentity;
export function resolveIdentity(
  brandId: AnalyticsBrandId,
  input: Omit<IdentityResolutionInput, "brandId">,
): ResolvedIdentity;
/** @deprecated Unscoped identity resolution is rejected at runtime; callers must supply brandId. */
export function resolveIdentity(
  input: Omit<IdentityResolutionInput, "brandId"> & { brandId?: AnalyticsBrandId },
): ResolvedIdentity;
export function resolveIdentity(
  first:
    | IdentityResolutionInput
    | (Omit<IdentityResolutionInput, "brandId"> & { brandId?: AnalyticsBrandId })
    | AnalyticsBrandId,
  second?: Omit<IdentityResolutionInput, "brandId">,
): ResolvedIdentity {
  const input =
    typeof first === "string"
      ? { ...(second as Omit<IdentityResolutionInput, "brandId">), brandId: first }
      : first;

  const brandId = input?.brandId;
  assertValidBrandId(brandId);

  if (typeof input.anonymousId !== "string" || !input.anonymousId.trim()) {
    throw new Error("invalid_analytics_anonymous_id");
  }
  if (typeof input.sessionId !== "string" || !input.sessionId.trim()) {
    throw new Error("invalid_analytics_session_id");
  }

  const anonymousNode = linkBrandScopedAnonymousIdentity({
    brandId,
    anonymousId: input.anonymousId,
    sessionId: input.sessionId,
    deviceId: input.deviceId,
  });

  const hashedEmail = secureHash(input.email);
  const hashedPhone = secureHash(input.phone);

  const deterministicCandidate =
    (input.userId ? findIdentityNode(brandId, "user_id", input.userId) : undefined) ??
    (input.crmId ? findIdentityNode(brandId, "crm_id", input.crmId) : undefined) ??
    (hashedEmail ? findIdentityNode(brandId, "hashed_email", hashedEmail) : undefined) ??
    (hashedPhone ? findIdentityNode(brandId, "hashed_phone", hashedPhone) : undefined);

  const now = new Date().toISOString();
  const identifiers = {
    anonymous_id: input.anonymousId,
    session_id: input.sessionId,
    user_id: input.userId,
    crm_id: input.crmId,
    lead_id: input.leadId,
    device_id: input.deviceId,
    hashed_email: hashedEmail,
    hashed_phone: hashedPhone,
  };

  if (deterministicCandidate && deterministicCandidate.brandId === brandId) {
    const merged = mergeIdentityNodes(deterministicCandidate.id, anonymousNode.id);
    if (merged) {
      const updatedMerged = saveIdentityNode(brandId, {
        ...merged.merged,
        brandId,
        identifiers: {
          ...merged.merged.identifiers,
          ...identifiers,
        },
        confidence: Math.max(
          merged.merged.confidence,
          calculateDeterministicConfidence({ ...merged.merged.identifiers, ...identifiers }),
        ),
        updatedAt: now,
      });
      return { node: updatedMerged, matchType: "merged" };
    }
  }

  const probabilisticScore = calculateProbabilisticConfidence({
    userAgent: input.userAgent,
    locale: input.locale,
    sessionContinuity: true,
    sameCampaign: Boolean(input.campaignId),
  });

  const node: IdentityNode = {
    id: deterministicCandidate?.id ?? `identity:${brandId}:${input.anonymousId}_${Date.now().toString(36)}`,
    brandId,
    identifiers,
    confidence: Math.max(calculateDeterministicConfidence(identifiers), probabilisticScore, anonymousNode.confidence),
    createdAt: deterministicCandidate?.createdAt ?? now,
    updatedAt: now,
  };

  saveIdentityNode(brandId, node);
  addIdentityEdge({
    from: anonymousNode.id,
    to: node.id,
    relation: input.userId ? "authenticated_transition" : "lead_capture",
    confidence: node.confidence,
    createdAt: now,
  });

  return {
    node,
    matchType: deterministicCandidate ? "deterministic" : probabilisticScore >= 0.4 ? "probabilistic" : "anonymous",
  };
}
