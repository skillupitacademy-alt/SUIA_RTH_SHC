import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createTotpSessionToken, requireSuperAdmin } from '@/lib/skillhubcore-admin-guards';

const payloadSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = payloadSchema.safeParse(await request.json().catch(() => null));
  if (body.success === false) {
    return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 });
  }

  const sessionToken = createTotpSessionToken(access.user);

  return NextResponse.json({
    verified: true,
    sessionToken,
  });
}
