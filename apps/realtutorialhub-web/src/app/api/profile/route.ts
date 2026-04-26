import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { withObservability } from '@/middleware/observability.middleware';
import { 
  handleProfileGet, 
  handleProfilePatch 
} from '../../../../../../src/share-branding/auth/bffProfileHandler';

/**
 * 🔐 REALTUTORIALHUB BFF PROFILE ROUTE
 * 
 * Uses shared handler to eliminate code duplication.
 * Implementation is in: src/share-branding/auth/bffProfileHandler.ts
 */

export const dynamic = 'force-dynamic';

// 🔥 OBSERVABILITY: Wrap with withObservability for full request tracing
export const GET = withObservability(async (req: NextRequest, _obsCtx: unknown) => {
  const response = await handleProfileGet(req);
  // Convert Response to NextResponse
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});

export const PATCH = withObservability(async (req: NextRequest, _obsCtx: unknown) => {
  const response = await handleProfilePatch(req);
  // Convert Response to NextResponse
  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});