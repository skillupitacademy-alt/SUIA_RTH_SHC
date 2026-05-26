import type { IdentityKey, IdentityNode } from "./identity-store";

export interface IdentityEdge {
  from: string;
  to: string;
  relation:
    | "same_user"
    | "same_device"
    | "authenticated_transition"
    | "crm_sync"
    | "lead_capture";
  confidence: number;
  createdAt: string;
}

const identityEdges: IdentityEdge[] = [];

export function addIdentityEdge(edge: IdentityEdge) {
  identityEdges.push(edge);
  return edge;
}

export function getIdentityEdgesForNode(nodeId: string) {
  return identityEdges.filter((edge) => edge.from === nodeId || edge.to === nodeId);
}

export function calculateDeterministicConfidence(identifiers: Partial<Record<IdentityKey, string>>) {
  const strongKeys: IdentityKey[] = ["user_id", "crm_id", "hashed_email", "hashed_phone"];
  const mediumKeys: IdentityKey[] = ["lead_id", "device_id"];
  const strongMatches = strongKeys.filter((key) => identifiers[key]).length;
  const mediumMatches = mediumKeys.filter((key) => identifiers[key]).length;

  return Math.min(1, strongMatches * 0.35 + mediumMatches * 0.15);
}

export function calculateProbabilisticConfidence(input: {
  userAgent?: string;
  locale?: string;
  sessionContinuity?: boolean;
  sameCampaign?: boolean;
}) {
  let score = 0;
  if (input.sessionContinuity) score += 0.35;
  if (input.sameCampaign) score += 0.2;
  if (input.userAgent) score += 0.15;
  if (input.locale) score += 0.1;
  return Math.min(1, score);
}

export function buildIdentityGraphSnapshot(nodes: IdentityNode[]) {
  return {
    nodes,
    edges: identityEdges.filter((edge) => nodes.some((node) => node.id === edge.from || node.id === edge.to)),
  };
}

