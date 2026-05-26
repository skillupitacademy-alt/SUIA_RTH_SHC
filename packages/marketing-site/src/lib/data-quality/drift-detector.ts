const eventFieldRegistry = new Map<string, Set<string>>();

export function detectSchemaDrift(eventName: string, payload: Record<string, unknown>) {
  const fields = new Set(Object.keys(payload));
  const previous = eventFieldRegistry.get(eventName);
  eventFieldRegistry.set(eventName, fields);

  if (!previous) {
    return { drifted: false, added: [...fields], removed: [] };
  }

  return {
    drifted: [...fields].some((field) => !previous.has(field)) || [...previous].some((field) => !fields.has(field)),
    added: [...fields].filter((field) => !previous.has(field)),
    removed: [...previous].filter((field) => !fields.has(field)),
  };
}

