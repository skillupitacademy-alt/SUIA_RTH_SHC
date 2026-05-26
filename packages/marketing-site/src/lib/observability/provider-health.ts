const providerHealth = new Map<string, { failures: number; latencyMs: number[] }>();

export function recordProviderHealth(providerId: string, latencyMs: number, failed = false) {
  const current = providerHealth.get(providerId) ?? { failures: 0, latencyMs: [] };
  current.latencyMs.push(latencyMs);
  if (failed) current.failures += 1;
  providerHealth.set(providerId, current);
}

export function getProviderHealthSnapshot() {
  return Object.fromEntries(
    [...providerHealth.entries()].map(([providerId, value]) => [
      providerId,
      {
        failures: value.failures,
        p95LatencyMs: [...value.latencyMs].sort((a, b) => a - b)[Math.max(0, Math.floor(value.latencyMs.length * 0.95) - 1)] ?? 0,
      },
    ]),
  );
}

