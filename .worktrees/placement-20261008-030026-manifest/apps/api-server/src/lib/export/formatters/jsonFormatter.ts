import type { ExportPayload } from '../exportTypes';

export class JsonFormatter {
  format(payload: ExportPayload): Buffer {
    const envelope = {
      schema_version: "2.0",
      export_type: "analytical_intelligence",
      generated_at: new Date().toISOString(),
      meta: payload.meta,
      content: {
        aggregations: payload.aggregations,
        historical_progress: payload.historicalProgress,
        guidance_signals: payload.guidanceSignals,
        raw_attempts: payload.rawAttempts
      }
    };

    return Buffer.from(JSON.stringify(envelope, null, 2));
  }
}
