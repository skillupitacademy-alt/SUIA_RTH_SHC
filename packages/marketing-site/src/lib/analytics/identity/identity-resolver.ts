import { createHash } from "node:crypto";

import { addIdentityEdge, calculateDeterministicConfidence, calculateProbabilisticConfidence } from "./identity-graph";
import { linkAnonymousIdentity } from "./anonymous-linking";
import { findIdentityNode, saveIdentityNode, type IdentityNode } from "./identity-store";
import { mergeIdentityNodes } from "./user-merge-engine";

export interface IdentityResolutionInput {
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

function secureHash(value?: string) {
  if (!value) {
    return undefined;
  }

  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function resolveIdentity(input: IdentityResolutionInput): ResolvedIdentity {
  const anonymousNode = linkAnonymousIdentity({
    anonymousId: input.anonymousId,
    sessionId: input.sessionId,
    deviceId: input.deviceId,
  });

  const hashedEmail = secureHash(input.email);
  const hashedPhone = secureHash(input.phone);

  const deterministicCandidate =
    (input.userId ? findIdentityNode("user_id", input.userId) : undefined) ??
    (input.crmId ? findIdentityNode("crm_id", input.crmId) : undefined) ??
    (hashedEmail ? findIdentityNode("hashed_email", hashedEmail) : undefined) ??
    (hashedPhone ? findIdentityNode("hashed_phone", hashedPhone) : undefined);

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

  if (deterministicCandidate) {
    const merged = mergeIdentityNodes(deterministicCandidate.id, anonymousNode.id);
    if (merged) {
      return { node: merged.merged, matchType: "merged" };
    }
  }

  const probabilisticScore = calculateProbabilisticConfidence({
    userAgent: input.userAgent,
    locale: input.locale,
    sessionContinuity: true,
    sameCampaign: Boolean(input.campaignId),
  });

  const node: IdentityNode = {
    id: deterministicCandidate?.id ?? `identity_${input.anonymousId}_${Date.now().toString(36)}`,
    identifiers,
    confidence: Math.max(calculateDeterministicConfidence(identifiers), probabilisticScore, anonymousNode.confidence),
    createdAt: deterministicCandidate?.createdAt ?? now,
    updatedAt: now,
  };

  saveIdentityNode(node);
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
