import { NextRequest, NextResponse } from 'next/server';
import { db, userProfiles } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { TokenService } from '@/modules/auth/token.service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, payload.userId),
    });

    return NextResponse.json(profile || { error: 'Profile not found' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const token = TokenService.getAccessToken(req, { scope: 'user' });
    if (!token) return NextResponse.json({ error: 'Unauthorized', scope: 'user' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token, false);
    const body = await req.json();

    const [updated] = await db.update(userProfiles)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(userProfiles.userId, payload.userId))
      .returning();

    if (updated) {
        return NextResponse.json(updated);
    }

    // Fallback: Create profile if it doesn't exist
    const [inserted] = await db.insert(userProfiles).values({
        userId: payload.userId,
        name: 'User', // Default name, client typically sends name updates separately or we assume one exists
        ...body
    }).returning();

    return NextResponse.json(inserted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

// Support POST as an alias for PATCH for environments that block PATCH
export async function POST(req: NextRequest) {
  return PATCH(req);
}
