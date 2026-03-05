import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';

// Example GET route wrapped with production-safe logging.
export const GET = withLogging(async () => {
    return ApiResponse.success({ status: 'ok' });
});
