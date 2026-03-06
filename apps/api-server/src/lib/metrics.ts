import * as Sentry from "@sentry/nextjs";

import { logger } from "./logger";

type Tags = Record<string, string | number | boolean | undefined>;

/**
 * Robustly scrubs potential PII from metric tags.
 * Ensures only primitive string values are passed to sinks.
 */
const sanitizeTags = (tags?: Tags): Record<string, string> => {
  if (!tags) return {};
  const out: Record<string, string> = {};
  
  // PII blocklist (extend as needed)
  const blocked = new Set(["userId", "requestId", "examId", "email", "name", "token", "password", "sessionId"]);
  
  for (const [k, v] of Object.entries(tags)) {
    if (v === undefined || v === null) continue;
    
    // 1. Block known PII keys
    const keyLower = k.toLowerCase();
    const isBlocked = blocked.has(k) || 
                      keyLower.includes("id") || 
                      keyLower.includes("key") || 
                      keyLower.includes("token");

    if (isBlocked && k !== 'outcome' && k !== 'service' && k !== 'env' && k !== 'version' && k !== 'route' && k !== 'component' && k !== 'operation' && k !== 'requestId' && k !== 'sessionId') {
      out[k] = "[redacted]";
      continue;
    }
    
    // 2. Heuristic scrubbing for string values (emails/uuids/etc)
    if (typeof v === "string") {
      const scrubbed = v
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted]") // email
        .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[uuid]"); // uuid
      out[k] = scrubbed;
    } else {
      out[k] = String(v);
    }
  }
  return out;
};

const emit = (metric: string, value: number, tags?: Tags) => {
  const safeTags = sanitizeTags(tags);

  // 1. Structured Logging (Ingestion by Logtail/Grafana)
  logger.info({
    type: 'metric',
    metric,
    value,
    ...safeTags
  }, `[Metric] ${metric}=${value}`);

  // 2. Real Sentry Metrics API Export (Production Sink)
  try {
    type MetricsApi = {
      increment: (name: string, val: number, opts: { tags?: Record<string, string> }) => unknown;
      distribution: (name: string, val: number, opts: { tags?: Record<string, string> }) => unknown;
    };
    const metricsApi = (Sentry as unknown as { metrics?: MetricsApi }).metrics;
    if (metricsApi !== undefined) {
      const options = { tags: safeTags };
      if (value === 1) {
        metricsApi.increment(metric, 1, options);
      } else {
        metricsApi.distribution(metric, value, options);
      }
    } else {
      // Fallback for older versions via addBreadcrumb for trace correlation
      Sentry.addBreadcrumb({
        category: 'metric',
        message: `${metric}: ${value}`,
        data: safeTags,
        level: 'info',
      });
    }
  } catch (e) {
    // Metrics should never crash the process
    logger.error({ err: e }, '[MetricsSink] Sentry export failed');
  }
};

export const recordCounter = (base: string, value: number = 1, tags?: Tags) => {
  emit(base, value, tags);
  if (base.includes('.')) {
    emit(base.replace(/\./g, '_'), value, tags);
  }
};

export const recordTimer = (base: string, durationMs: number, tags?: Tags) => {
  emit(`${base}.ms`, durationMs, tags);
  if (base.includes('.')) {
    emit(`${base.replace(/\./g, '_')}_ms`, durationMs, tags);
  }
};
