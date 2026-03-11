import { ApiResponse } from '@/lib/api-response';
import { withCacheHeaders } from '@/lib/cache-headers';
import { redisConnection as queueConnection } from '@/lib/queue/queue.config';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';

// Health check with Redis status (Task 109).
export const GET = withLogging(async () => {
    let redisStatus = 'error';
    try {
        const ping = await queueConnection.ping();
        if (ping === 'PONG') redisStatus = 'ok';
    } catch (_err: unknown) {
        redisStatus = 'down';
    }

    return withCacheHeaders(ApiResponse.success({ 
        status: 'ok',
        redis: redisStatus,
        timestamp: new Date().toISOString()
    }), 'DYNAMIC');
});
