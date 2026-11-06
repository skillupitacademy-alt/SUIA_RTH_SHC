import type { AnalyticsBrandId } from "../../../config/analytics";

export type IdentityKey =
  | "anonymous_id"
  | "session_id"
  | "user_id"
  | "crm_id"
  | "device_id"
  | "lead_id"
  | "hashed_email"
  | "hashed_phone";

export interface IdentityNode {
  id: string;
  brandId?: AnalyticsBrandId;
  identifiers: Partial<Record<IdentityKey, string>>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  mergedInto?: string;
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

function extractBrandPrefixFromNodeId(nodeId: unknown): AnalyticsBrandId | undefined {
  if (typeof nodeId !== "string") {
    return undefined;
  }
  for (const candidate of VALID_ANALYTICS_BRANDS) {
    if (nodeId.startsWith(`identity:${candidate}:`) || nodeId.startsWith(`identity_${candidate}_`)) {
      return candidate;
    }
  }
  return undefined;
}

const identityStoreByBrand = new Map<AnalyticsBrandId, Map<string, IdentityNode>>();
const identityIndexByBrand = new Map<AnalyticsBrandId, Map<string, string>>();

function toIndexKey(type: IdentityKey, value: string) {
  return JSON.stringify([type, value]);
}

export function saveIdentityNode(brandId: AnalyticsBrandId, node: IdentityNode): IdentityNode;
export function saveIdentityNode(node: IdentityNode, brandId?: AnalyticsBrandId): IdentityNode;
export function saveIdentityNode(
  first: AnalyticsBrandId | IdentityNode,
  second?: IdentityNode | AnalyticsBrandId,
): IdentityNode {
  let node: IdentityNode | undefined;
  let explicitBrandId: unknown;

  if (typeof first === "string") {
    explicitBrandId = first;
    node = second as IdentityNode | undefined;
  } else {
    node = first;
    explicitBrandId = second;
  }

  if (!node || typeof node !== "object" || typeof node.id !== "string" || !node.id.trim()) {
    throw new Error("invalid_analytics_identity_node");
  }

  const nodeBrand = node.brandId ?? extractBrandPrefixFromNodeId(node.id);
  const resolvedBrand = explicitBrandId !== undefined ? explicitBrandId : nodeBrand;
  assertValidBrandId(resolvedBrand);

  if (node.brandId !== undefined && node.brandId !== resolvedBrand) {
    throw new Error("invalid_analytics_brand_mismatch");
  }
  const idPrefixBrand = extractBrandPrefixFromNodeId(node.id);
  if (idPrefixBrand !== undefined && idPrefixBrand !== resolvedBrand) {
    throw new Error("invalid_analytics_brand_mismatch");
  }

  const scopedNode: IdentityNode = {
    ...node,
    brandId: resolvedBrand,
  };

  let brandStore = identityStoreByBrand.get(resolvedBrand);
  if (!brandStore) {
    brandStore = new Map<string, IdentityNode>();
    identityStoreByBrand.set(resolvedBrand, brandStore);
  }

  let brandIndex = identityIndexByBrand.get(resolvedBrand);
  if (!brandIndex) {
    brandIndex = new Map<string, string>();
    identityIndexByBrand.set(resolvedBrand, brandIndex);
  }

  brandStore.set(scopedNode.id, scopedNode);

  for (const [type, value] of Object.entries(scopedNode.identifiers ?? {}) as Array<[IdentityKey, string | undefined]>) {
    if (value) {
      brandIndex.set(toIndexKey(type, value), scopedNode.id);
    }
  }

  return scopedNode;
}

export function findIdentityNode(
  brandId: AnalyticsBrandId,
  type: IdentityKey,
  value: string,
): IdentityNode | undefined;
export function findIdentityNode(
  type: IdentityKey,
  value: string,
  brandId: AnalyticsBrandId,
): IdentityNode | undefined;
/** @deprecated Unscoped identity lookup is rejected at runtime; callers must supply brandId. */
export function findIdentityNode(
  type: IdentityKey,
  value: string,
  brandId?: AnalyticsBrandId,
): IdentityNode | undefined;
export function findIdentityNode(
  first: AnalyticsBrandId | IdentityKey,
  second: IdentityKey | string,
  third?: string | AnalyticsBrandId,
): IdentityNode | undefined {
  let brandId: unknown;
  let type: IdentityKey;
  let value: string | undefined;

  if (isValidBrandId(first) && typeof third === "string") {
    brandId = first;
    type = second as IdentityKey;
    value = third;
  } else {
    type = first as IdentityKey;
    value = second;
    brandId = third;
  }

  assertValidBrandId(brandId);
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const brandIndex = identityIndexByBrand.get(brandId);
  const brandStore = identityStoreByBrand.get(brandId);
  if (!brandIndex || !brandStore) {
    return undefined;
  }

  const id = brandIndex.get(toIndexKey(type, value));
  return id ? brandStore.get(id) : undefined;
}

export function getIdentityNode(brandId: AnalyticsBrandId, id: string): IdentityNode | undefined;
export function getIdentityNode(id: string, brandId: AnalyticsBrandId): IdentityNode | undefined;
/** @deprecated Unscoped identity lookup requires a brand-prefixed id or explicit brandId. */
export function getIdentityNode(id: string, brandId?: AnalyticsBrandId): IdentityNode | undefined;
export function getIdentityNode(first: string, second?: string): IdentityNode | undefined {
  let brandId: unknown;
  let id: unknown;

  if (second !== undefined) {
    if (isValidBrandId(first) && !isValidBrandId(second)) {
      brandId = first;
      id = second;
    } else if (isValidBrandId(second) && !isValidBrandId(first)) {
      id = first;
      brandId = second;
    } else {
      brandId = first;
      id = second;
    }
  } else {
    id = first;
    brandId = extractBrandPrefixFromNodeId(first);
  }

  assertValidBrandId(brandId);
  if (typeof id !== "string" || !id.trim()) {
    throw new Error("invalid_analytics_identity_id");
  }

  return identityStoreByBrand.get(brandId)?.get(id);
}

export function listIdentityNodes(brandId: AnalyticsBrandId): IdentityNode[] {
  assertValidBrandId(brandId);
  const brandStore = identityStoreByBrand.get(brandId);
  return brandStore ? [...brandStore.values()] : [];
}
