export interface TraceSpan {
  name: string;
  startedAt: string;
  endedAt?: string;
  attributes?: Record<string, string | number | boolean>;
}

const spans: TraceSpan[] = [];

export function startSpan(name: string, attributes?: TraceSpan["attributes"]) {
  const span: TraceSpan = {
    name,
    startedAt: new Date().toISOString(),
    attributes,
  };
  spans.push(span);
  return span;
}

export function endSpan(span: TraceSpan) {
  span.endedAt = new Date().toISOString();
  return span;
}

export function getTraceSpans() {
  return [...spans];
}

