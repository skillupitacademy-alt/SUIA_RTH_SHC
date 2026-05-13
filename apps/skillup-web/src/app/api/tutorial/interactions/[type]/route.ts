import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth } from '@/lib/student-auth';

export const dynamic = 'force-dynamic';

const allowedInteractionTypes = new Set(['quiz', 'practice', 'code', 'visual', 'completion']);

function buildApiUrl(type: string, requestUrl: string) {
  const apiUrl = process.env.INTERNAL_API_URL || process.env.GATEWAY_URL || 'http://localhost:3000';
  const url = new URL(`${apiUrl}/tutorial/interactions/${type}`);
  const sourceUrl = new URL(requestUrl);
  sourceUrl.searchParams.forEach((value, key) => url.searchParams.set(key, value));
  return url;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const params = await context.params;
  if (!allowedInteractionTypes.has(params.type)) {
    return NextResponse.json({ error: 'Unsupported interaction type' }, { status: 404 });
  }

  const authResult = await requireStudentAuth(request);
  if (!authResult.ok) return authResult.response;

  const response = await fetch(buildApiUrl(params.type, request.url), {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('content-type') || 'application/json',
      'X-Brand': 'skillup',
      'X-User-ID': authResult.userId,
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
    },
    body: await request.text(),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({ error: 'Interaction request failed' }));
  return NextResponse.json(payload, { status: response.status });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const params = await context.params;
  if (!allowedInteractionTypes.has(params.type)) {
    return NextResponse.json({ error: 'Unsupported interaction type' }, { status: 404 });
  }

  const authResult = await requireStudentAuth(request);
  if (!authResult.ok) return authResult.response;

  const response = await fetch(buildApiUrl(params.type, request.url), {
    headers: {
      'X-Brand': 'skillup',
      'X-User-ID': authResult.userId,
      'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({ error: 'Interaction request failed' }));
  return NextResponse.json(payload, { status: response.status });
}

