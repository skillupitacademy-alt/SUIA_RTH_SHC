/**
 * 📊 DISTRIBUTED TRACING SYSTEM
 * 
 * Enables end-to-end request tracing across:
 * Cloudflare → BFF → API → Database
 * 
 * Usage:
 * 1. Generate trace ID at entry point
 * 2. Pass trace ID through all layers
 * 3. Log events with trace ID
 * 4. Query trace by ID for debugging
 */

export interface TraceEvent {
  step: string;
  data: Record<string, unknown>;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
}

export interface Trace {
  traceId: string;
  events: TraceEvent[];
  startTime: number;
  endTime?: number;
}

// In-memory trace store (use Redis/DB in production)
const traces = new Map<string, Trace>();

// Trace retention time (5 minutes)
const TRACE_TTL = 5 * 60 * 1000;

/**
 * Initialize a new trace
 */
export function initTrace(traceId: string): void {
  traces.set(traceId, {
    traceId,
    events: [],
    startTime: Date.now(),
  });

  // Auto-cleanup after TTL
  setTimeout(() => {
    traces.delete(traceId);
  }, TRACE_TTL);
}

/**
 * Add an event to a trace
 */
export function addTraceEvent(
  traceId: string,
  step: string,
  data: Record<string, unknown>,
  level: 'info' | 'warn' | 'error' = 'info'
): void {
  const trace = traces.get(traceId);
  
  if (!trace) {
    // Trace doesn't exist, create it
    initTrace(traceId);
  }

  const event: TraceEvent = {
    step,
    data,
    timestamp: Date.now(),
    level,
  };

  traces.get(traceId)?.events.push(event);

  // Log to console for immediate visibility
  const emoji = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
  console.log(`${emoji} [TRACE ${traceId}] ${step}`, JSON.stringify(data));
}

/**
 * Complete a trace
 */
export function completeTrace(traceId: string): void {
  const trace = traces.get(traceId);
  if (trace) {
    trace.endTime = Date.now();
  }
}

/**
 * Get a trace by ID
 */
export function getTrace(traceId: string): Trace | undefined {
  return traces.get(traceId);
}

/**
 * Get all traces (for debugging)
 */
export function getAllTraces(): Trace[] {
  return Array.from(traces.values());
}

/**
 * Clear all traces (for testing)
 */
export function clearTraces(): void {
  traces.clear();
}

/**
 * Get trace summary
 */
export function getTraceSummary(traceId: string): {
  traceId: string;
  duration: number;
  steps: string[];
  errors: number;
  warnings: number;
} | null {
  const trace = traces.get(traceId);
  
  if (!trace) {
    return null;
  }

  const duration = (trace.endTime || Date.now()) - trace.startTime;
  const steps = trace.events.map(e => e.step);
  const errors = trace.events.filter(e => e.level === 'error').length;
  const warnings = trace.events.filter(e => e.level === 'warn').length;

  return {
    traceId,
    duration,
    steps,
    errors,
    warnings,
  };
}

/**
 * Helper to trace a function execution
 */
export async function traceFunction<T>(
  traceId: string,
  step: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const startTime = Date.now();
  
  addTraceEvent(traceId, `${step}_START`, metadata || {});

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    
    addTraceEvent(traceId, `${step}_SUCCESS`, {
      ...metadata,
      duration,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    addTraceEvent(
      traceId,
      `${step}_ERROR`,
      {
        ...metadata,
        duration,
        error: error instanceof Error ? error.message : String(error),
      },
      'error'
    );

    throw error;
  }
}
