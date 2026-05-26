const featureStore = new Map<string, Record<string, number | string | boolean>>();

export function upsertFeatures(identityId: string, features: Record<string, number | string | boolean>) {
  const current = featureStore.get(identityId) ?? {};
  featureStore.set(identityId, { ...current, ...features });
}

export function getFeatures(identityId: string) {
  return featureStore.get(identityId) ?? {};
}

