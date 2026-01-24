import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { AuthService } from '@/modules/auth/auth.service';
import { TokenService } from '@/modules/auth/token.service';
import { db, userProfiles } from '@quiz/db';
import { eq } from 'drizzle-orm';

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await TokenService.verifyAccessToken(token);
    const data = await req.json();

    // Update user profile in DB
    await db.update(userProfiles)
      .set({
        educationLevel: data.educationLevel,
        professionalStatus: data.role,
        experienceYears: parseInt(data.experience) || 0,
        domainInterest: data.domain ? [data.domain] : [],
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.userId, payload.userId));

    return NextResponse.json({ message: 'Profile updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
