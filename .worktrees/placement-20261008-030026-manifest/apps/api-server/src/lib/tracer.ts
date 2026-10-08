import { Span, SpanStatusCode, trace } from '@opentelemetry/api';

/**
 * Global tracer instance for the API Server.
 * Sentry's Next.js SDK automatically registers the global OpenTelemetry provider,
 * meaning spans emitted from this tracer will seamlessly integrate with Sentry APM.
 */
export const tracer = trace.getTracer('api-server');

/**
 * Executes a given asynchronous operation within an OpenTelemetry span.
 * Automatically handles `span.end()`, marks the span with `SpanStatusCode.ERROR` if the
 * operation throws, and captures the exception details.
 *
 * @param name - The name/label of the span (e.g., 'ReportMaterializer.build')
 * @param operation - The asynchronous work to be instrumented
 * @param options - Optional span creation tags/attributes
 * @returns The resolved value of the `operation`
 */
export async function withSpan<T>(
  name: string,
  operation: (span: Span) => Promise<T>,
  options?: Parameters<typeof tracer.startSpan>[1]
): Promise<T> {
  return tracer.startActiveSpan(name, options ?? {}, async (span) => {
    try {
      const result = await operation(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      // Rethrow to preserve caller control flow
      throw error;
    } finally {
      span.end();
    }
  });
}
