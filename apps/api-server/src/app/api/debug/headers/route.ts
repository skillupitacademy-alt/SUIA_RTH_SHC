/**
 * 🔍 DEBUG ENDPOINT - Shows what headers API server receives
 * TEMPORARY - Remove after debugging
 */

import type { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { getAuthContext } from '@/lib/auth-context';

export const dynamic = 'force-dynamic';

async function getHandler(req: NextRequest) {
  try {
    const auth = await getAuthContext(req);
    
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      if (key.startsWith('x-')) {
        headers[key] = value;
      }
    });
    
    return ApiResponse.success({
      auth: {
        isAuthenticated: !!auth,
        userId: auth?.userId,
        brand: auth?.brand,
        roles: auth?.roles,
        source: auth?.source,
      },
      headers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return ApiResponse.error(error, 500);
  }
}

export const GET = getHandler;
