import { logger } from "./logger";

/**
 * Metric utility for recording stage durations and other telemetry.
 * Logs structured JSON lines prefix with 'MEASURE |' for easy parsing by log drains.
 */
export const metrics = {
  /**
   * Record a timing measurement.
   * @param name The name of the metric (e.g., 'report.render_duration')
   * @param valueMs The duration in milliseconds
   * @param tags Optional metadata tags
   */
  timing(name: string, valueMs: number, tags: Record<string, string | number | boolean> = {}) {
    const payload = {
      metric: name,
      value: valueMs,
      unit: "ms",
      timestamp: new Date().toISOString(),
      ...tags
    };

    // Log a structured string prefix for visibility in raw logs
    logger.info(payload, `MEASURE | ${name} | ${valueMs}ms`);
  },

  /**
   * Increment a counter metric.
   */
  increment(name: string, tags: Record<string, string | number | boolean> = {}) {
    const payload = {
      metric: name,
      type: "counter",
      timestamp: new Date().toISOString(),
      ...tags
    };

    logger.info(payload, `COUNT | ${name}`);
  }
};
