import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';

// Example GET route wrapped with production-safe logging.
export const GET = withLogging(async () => {
    return NextResponse.json({ status: 'ok' });
});
