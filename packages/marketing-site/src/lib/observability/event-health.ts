const eventCounts = new Map<string, number>();

export function recordEventHealth(eventName: string) {
  eventCounts.set(eventName, (eventCounts.get(eventName) ?? 0) + 1);
}

export function getEventHealthSnapshot() {
  return Object.fromEntries(eventCounts.entries());
}

