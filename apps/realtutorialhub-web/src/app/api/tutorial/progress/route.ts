import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AssignmentAuthError, requireStudent } from '@/lib/assignment-auth';
import { serverErrorResponse } from '@/share-branding/api/server-error';

export const dynamic = 'force-dynamic';

const tokenService = new TokenService();

function credentialHeaders(request: NextRequest): Record<string, string> {
  const token = tokenService.getAccessToken(request, { scope: 'user' });
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const csrf = request.cookies.get('csrfToken')?.value;
  const csrfHeader = request.headers.get('x-csrf-token');
  const origin = request.headers.get('origin');
  if (csrf) headers.Cookie = `csrfToken=${csrf}`;
  if (csrfHeader) headers['x-csrf-token'] = csrfHeader;
  if (origin) headers.Origin = origin;
  return headers;
}

const blockTypeSchema = z.enum(['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor']);

const getQuerySchema = z.object({
  subtopicId: z.string().uuid(),
});

const postBodySchema = z.object({
  subtopicId: z.string().uuid(),
  blockType: blockTypeSchema,
  status: z.literal('viewed'),
});

/**
 * GET /api/tutorial/progress
 * 
 * RTH BFF - Calls centralized Tutorial Engine in API server
 */
async function getHandler(request: NextRequest) {
  try {
    const user = await requireStudent(request);
    const parsed = getQuerySchema.safeParse({
      subtopicId: request.nextUrl.searchParams.get('subtopicId') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid subtopicId' }, { status: 400 });
    }

    // Call API server
    const apiUrl = (process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in')
      .replace(/\/+$/, '').replace(/\/api$/, '');
    const response = await fetch(
      `${apiUrl}/api/tutorial/progress?subtopicId=${parsed.data.subtopicId}`,
      {
        headers: {
          ...credentialHeaders(request),
          'X-Brand': 'realtutorialhub',
          'X-User-ID': user.userId,
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      if (response.status >= 500) {
        return serverErrorResponse(request, response.status, 'Progress service unavailable');
      }
      return NextResponse.json({ error: 'Failed to get progress' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return serverErrorResponse(request, 500, 'Internal server error', error);
  }
}

/**
 * POST /api/tutorial/progress
 * 
 * RTH BFF - Calls centralized Tutorial Engine in API server
 */
async function postHandler(request: NextRequest) {
  try {
    const user = await requireStudent(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    // Call API server
    const apiUrl = (process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'https://api.skillhubcore.in')
      .replace(/\/+$/, '').replace(/\/api$/, '');
    const response = await fetch(
      `${apiUrl}/api/tutorial/progress`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...credentialHeaders(request),
          'X-Brand': 'realtutorialhub',
          'X-User-ID': user.userId,
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
        },
        body: JSON.stringify(parsed.data),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      if (response.status >= 500) {
        return serverErrorResponse(request, response.status, 'Progress service unavailable');
      }
      return NextResponse.json({ error: 'Failed to track progress' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof AssignmentAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return serverErrorResponse(request, 500, 'Internal server error', error);
  }
}

// Export handlers
export const GET = getHandler;
export const POST = postHandler;
