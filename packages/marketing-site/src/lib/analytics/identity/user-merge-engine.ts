import type { AnalyticsBrandId } from "../../../config/analytics";
import { addIdentityEdge, calculateDeterministicConfidence } from "./identity-graph";
import { getIdentityNode, saveIdentityNode, type IdentityNode } from "./identity-store";

export interface MergeResult {
  primary: IdentityNode;
  secondary: IdentityNode;
  merged: IdentityNode;
  conflicts: string[];
}

const VALID_ANALYTICS_BRANDS = new Set<AnalyticsBrandId>(["realtutorialhub", "skillupitacademy"]);

function isValidBrandId(value: unknown): value is AnalyticsBrandId {
  return typeof value === "string" && VALID_ANALYTICS_BRANDS.has(value as AnalyticsBrandId);
}

function extractNodeIdBrandPrefix(nodeId: string): { hasPrefix: boolean; brandId?: AnalyticsBrandId } {
  for (const candidate of VALID_ANALYTICS_BRANDS) {
    if (nodeId.startsWith(`identity:${candidate}:`) || nodeId.startsWith(`identity_${candidate}_`)) {
      return { hasPrefix: true, brandId: candidate };
    }
  }
  if (nodeId.startsWith("identity:") || nodeId.startsWith("identity_")) {
    return { hasPrefix: true, brandId: undefined };
  }
  return { hasPrefix: false, brandId: undefined };
}

function resolveVerifiedIdentityNode(
  nodeId: unknown,
  expectedBrandId?: AnalyticsBrandId,
): { brandId: AnalyticsBrandId; node: IdentityNode } | undefined {
  if (typeof nodeId !== "string" || !nodeId.trim()) {
    return undefined;
  }

  const prefixInfo = extractNodeIdBrandPrefix(nodeId);
  if (prefixInfo.hasPrefix && !prefixInfo.brandId) {
    return undefined;
  }

  if (expectedBrandId !== undefined && !isValidBrandId(expectedBrandId)) {
    return undefined;
  }

  if (prefixInfo.brandId && expectedBrandId && prefixInfo.brandId !== expectedBrandId) {
    return undefined;
  }

  const candidateBrands: AnalyticsBrandId[] = expectedBrandId
    ? [expectedBrandId]
    : [...VALID_ANALYTICS_BRANDS];

  const matches: Array<{ storeBrand: AnalyticsBrandId; node: IdentityNode }> = [];
  for (const candidateBrand of candidateBrands) {
    const found = getIdentityNode(candidateBrand, nodeId);
    if (found) {
      matches.push({ storeBrand: candidateBrand, node: found });
    }
  }

  if (matches.length !== 1) {
    return undefined;
  }

  const { storeBrand, node } = matches[0];
  if (!isValidBrandId(node.brandId) || node.brandId !== storeBrand) {
    return undefined;
  }

  if (prefixInfo.brandId && prefixInfo.brandId !== storeBrand) {
    return undefined;
  }

  if (expectedBrandId && node.brandId !== expectedBrandId) {
    return undefined;
  }

  return { brandId: storeBrand, node };
}

export function mergeIdentityNodes(
  primaryId: string,
  secondaryId: string,
  brandId?: AnalyticsBrandId,
): MergeResult | undefined {
  if (typeof primaryId !== "string" || typeof secondaryId !== "string" || primaryId === secondaryId) {
    return undefined;
  }

  const primaryResolved = resolveVerifiedIdentityNode(primaryId, brandId);
  const secondaryResolved = resolveVerifiedIdentityNode(secondaryId, brandId);

  if (!primaryResolved || !secondaryResolved) {
    return undefined;
  }

  if (primaryResolved.brandId !== secondaryResolved.brandId) {
    return undefined;
  }

  const verifiedBrand = primaryResolved.brandId;
  const primary = primaryResolved.node;
  const secondary = secondaryResolved.node;

  if (
    primary.id === secondary.id ||
    !isValidBrandId(primary.brandId) ||
    !isValidBrandId(secondary.brandId) ||
    primary.brandId !== verifiedBrand ||
    secondary.brandId !== verifiedBrand
  ) {
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
    brandId: verifiedBrand,
    identifiers: mergedIdentifiers,
    confidence: Math.max(primary.confidence, secondary.confidence, calculateDeterministicConfidence(mergedIdentifiers)),
    updatedAt: new Date().toISOString(),
  };

  saveIdentityNode(verifiedBrand, {
    ...secondary,
    brandId: verifiedBrand,
    mergedInto: primary.id,
    updatedAt: merged.updatedAt,
  });
  saveIdentityNode(verifiedBrand, merged);

  addIdentityEdge({
    from: secondary.id,
    to: primary.id,
    relation: "authenticated_transition",
    confidence: merged.confidence,
    createdAt: merged.updatedAt,
  });

  return { primary, secondary, merged, conflicts };
}

