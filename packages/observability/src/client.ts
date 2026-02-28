/**
 * Lightweight client-side metrics utility.
 * Sends metrics to the backend telemetry proxy with batching.
 */

interface MetricBatchItem {
    metric: string;
    value: number;
    tags: Record<string, string>;
    timestamp: number;
}

let metricQueue: MetricBatchItem[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;
const BATCH_INTERVAL_MS = 2000;
const MAX_BATCH_SIZE = 10;

async function flushMetrics() {
    if (metricQueue.length === 0) return;

    const batchToSend = [...metricQueue];
    metricQueue = [];
    if (batchTimer) {
        clearTimeout(batchTimer);
        batchTimer = null;
    }

    try {
        const sessionId = typeof window !== 'undefined' ? (sessionStorage.getItem('quiz_session_id') || sessionStorage.getItem('admin_session_id') || 'no-session') : 'unknown';
        const requestId = typeof window !== 'undefined' ? (sessionStorage.getItem('last_request_id') || 'no-request') : 'unknown';

        const response = await fetch('/api/telemetry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Request-ID': requestId,
                'X-Session-ID': sessionId,
            },
            body: JSON.stringify({
                type: 'batch',
                items: batchToSend.map(item => ({
                    ...item,
                    tags: {
                        ...item.tags,
                        sessionId,
                        requestId,
                        source: 'client',
                    }
                }))
            }),
        });

        if (!response.ok && process.env.NODE_ENV !== 'production') {
            console.warn('[Metrics] Batch delivery failed');
        }
    } catch (_e) {
        // Metrics should never block UI
    }
}

export async function recordClientMetric(metric: string, value: number = 1, tags: Record<string, string> = {}) {
    if (typeof window === 'undefined') return;

    metricQueue.push({
        metric,
        value,
        tags,
        timestamp: Date.now()
    });

    if (metricQueue.length >= MAX_BATCH_SIZE) {
        void flushMetrics();
    } else if (!batchTimer) {
        batchTimer = setTimeout(() => {
            void flushMetrics();
        }, BATCH_INTERVAL_MS);
    }
}
