import { addIdentityEdge, calculateDeterministicConfidence } from "./identity-graph";
import { getIdentityNode, saveIdentityNode, type IdentityNode } from "./identity-store";

export interface MergeResult {
  primary: IdentityNode;
  secondary: IdentityNode;
  merged: IdentityNode;
  conflicts: string[];
}

export function mergeIdentityNodes(primaryId: string, secondaryId: string): MergeResult | undefined {
  const primary = getIdentityNode(primaryId);
  const secondary = getIdentityNode(secondaryId);

  if (!primary || !secondary || primary.id === secondary.id) {
    return undefined;
  }

  const conflicts: string[] = [];
  const mergedIdentifiers = { ...secondary.identifiers, ...primary.identifiers };

  for (const key of Object.keys(primary.identifiers)) {
    const typedKey = key as keyof typeof primary.identifiers;
    if (
      primary.identifiers[typedKey] &&
      secondary.identifiers[typedKey] &&
      primary.identifiers[typedKey] !== secondary.identifiers[typedKey]
    ) {
      conflicts.push(typedKey);
    }
  }

  const merged: IdentityNode = {
    ...primary,
    identifiers: mergedIdentifiers,
    confidence: Math.max(primary.confidence, secondary.confidence, calculateDeterministicConfidence(mergedIdentifiers)),
    updatedAt: new Date().toISOString(),
  };

  saveIdentityNode({
    ...secondary,
    mergedInto: primary.id,
    updatedAt: merged.updatedAt,
  });
  saveIdentityNode(merged);

  addIdentityEdge({
    from: secondary.id,
    to: primary.id,
    relation: "authenticated_transition",
    confidence: merged.confidence,
    createdAt: merged.updatedAt,
  });

  return { primary, secondary, merged, conflicts };
}

