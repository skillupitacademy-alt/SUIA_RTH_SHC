import { addIdentityEdge } from "./identity-graph";
import { findIdentityNode, saveIdentityNode, type IdentityNode } from "./identity-store";

export function linkAnonymousIdentity(input: {
  anonymousId: string;
  sessionId: string;
  deviceId?: string;
}) {
  const now = new Date().toISOString();
  const existing = findIdentityNode("anonymous_id", input.anonymousId);
  if (existing) {
    return existing;
  }

  const node: IdentityNode = {
    id: `identity_${input.anonymousId}`,
    identifiers: {
      anonymous_id: input.anonymousId,
      session_id: input.sessionId,
      device_id: input.deviceId,
    },
    confidence: 0.3,
    createdAt: now,
    updatedAt: now,
  };

  saveIdentityNode(node);
  addIdentityEdge({
    from: node.id,
    to: node.id,
    relation: "same_device",
    confidence: 0.3,
    createdAt: now,
  });
  return node;
}

