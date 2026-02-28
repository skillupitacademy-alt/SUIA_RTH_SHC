import { db, userProfiles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { withLogging } from '@/lib/withLogging';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

interface ProfileUpdateBody {
  name?: string;
  professionalStatus?: string;
  educationLevel?: string;
  bio?: string;
}

async function getHandler(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (typeof _token !== 'string' || _token.trim() === '') {
      return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });
    }

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, _payload.userId),
    });

    if (!profile) {
      return NextResponse.json({ _error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Unauthorized';
    return NextResponse.json({ _error: message }, { status: 401 });
  }
}

async function patchHandler(_req: NextRequest) {
  try {
    const _token = TokenService.getAccessToken(_req, { scope: 'user' });
    if (_token === undefined || _token === null || _token === '') return NextResponse.json({ _error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const _payload = await TokenService.verifyAccessToken(_token, false);
    const body = await _req.json().catch(() => ({})) as ProfileUpdateBody;

    const [updated] = await db.update(userProfiles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(userProfiles.userId, _payload.userId))
      .returning();

    if (updated !== undefined && updated !== null) {
        return NextResponse.json(updated);
    }

    const [inserted] = await db.insert(userProfiles).values({
        userId: _payload.userId,
        name: 'User', 
        ...body
    }).returning();

    return NextResponse.json(inserted);
  } catch (_error: unknown) {
    const message = _error instanceof Error ? _error.message : 'Bad request';
    return NextResponse.json({ _error: message }, { status: 400 });
  }
}

export const GET = withLogging(getHandler, { component: 'auth', operation: 'get_profile' });
export const PATCH = withLogging(patchHandler, { component: 'auth', operation: 'update_profile' });
export const POST = withLogging(patchHandler, { component: 'auth', operation: 'update_profile_alias' });
