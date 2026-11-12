import { TokenService } from '@quiz/auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStudentAuth } from '@/lib/student-auth';

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
 * SkillUp BFF - Calls centralized Tutorial Engine in API server
 */
async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireStudentAuth(request);
    if (!authResult.ok) {
      return authResult.response;
    }
    const user = { userId: authResult.payload.userId };
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
          'X-Brand': 'skillup',
          'X-User-ID': user.userId,
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
          'x-internal-key': process.env.INTERNAL_API_KEY || '',
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to get progress' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[SkillUp Tutorial Progress] GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tutorial/progress
 * 
 * SkillUp BFF - Calls centralized Tutorial Engine in API server
 */
async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireStudentAuth(request);
    if (!authResult.ok) {
      return authResult.response;
    }
    const user = { userId: authResult.payload.userId };

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
          'X-Brand': 'skillup',
          'X-User-ID': user.userId,
          'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
          'x-internal-key': process.env.INTERNAL_API_KEY || '',
        },
        body: JSON.stringify(parsed.data),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to track progress' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[SkillUp Tutorial Progress] POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export handlers
export const GET = getHandler;
export const POST = postHandler;
