import { NextRequest, NextResponse } from 'next/server';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { db as tutorialDb, certificates } from '@quiz/db-tutorial';
import { db as coreDb, userProfiles } from '@quiz/db';

export const dynamic = 'force-dynamic';

const paramsSchema = z.object({
  verificationCode: z.string().min(1),
});

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ verificationCode: string }> }
) {
  const params = await context.params;
  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
  }

  const [certificate] = await tutorialDb
    .select()
    .from(certificates)
    .where(and(eq(certificates.verificationCode, parsed.data.verificationCode), isNull(certificates.deletedAt)));

  if (certificate === undefined) {
    return NextResponse.json({ error: 'Certificate not found', valid: false }, { status: 404 });
  }

  const [profile] = await coreDb
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, certificate.userId));

  return NextResponse.json(
    {
      studentName: profile?.name ?? certificate.userId,
      courseName: certificate.parentName,
      issuedDate: certificate.issuedAt.toISOString(),
      scope: certificate.scope,
      valid: true,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=86400',
      },
    }
  );
}
