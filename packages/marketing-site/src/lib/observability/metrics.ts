const counters = new Map<string, number>();

export function incrementMetric(name: string, value = 1) {
  counters.set(name, (counters.get(name) ?? 0) + value);
}

export function getMetricsSnapshot() {
  return Object.fromEntries(counters.entries());
}

