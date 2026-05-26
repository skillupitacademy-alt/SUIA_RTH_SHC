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
  identifiers: Partial<Record<IdentityKey, string>>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  mergedInto?: string;
}

const identityStore = new Map<string, IdentityNode>();
const identityIndex = new Map<string, string>();

function toIndexKey(type: IdentityKey, value: string) {
  return `${type}:${value}`;
}

export function saveIdentityNode(node: IdentityNode) {
  identityStore.set(node.id, node);

  for (const [type, value] of Object.entries(node.identifiers) as Array<[IdentityKey, string | undefined]>) {
    if (value) {
      identityIndex.set(toIndexKey(type, value), node.id);
    }
  }

  return node;
}

export function findIdentityNode(type: IdentityKey, value: string) {
  const id = identityIndex.get(toIndexKey(type, value));
  return id ? identityStore.get(id) : undefined;
}

export function getIdentityNode(id: string) {
  return identityStore.get(id);
}

export function listIdentityNodes() {
  return [...identityStore.values()];
}

