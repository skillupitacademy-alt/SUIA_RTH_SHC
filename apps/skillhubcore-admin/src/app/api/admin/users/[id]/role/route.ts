import { NextResponse } from 'next/server';
import { z } from 'zod';

import { findAdminUser } from '@/lib/skillhubcore-admin-data';
import { requireSuperAdmin, requireTotpSession } from '@/lib/skillhubcore-admin-guards';

const payloadSchema = z.object({
  role: z.enum(['student', 'faculty', 'admin', 'super_admin']),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const totpSession = requireTotpSession(request);
  if (totpSession instanceof NextResponse) {
    return totpSession;
  }

  const { id } = await params;
  const user = findAdminUser(id);
  if (user === undefined) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = payloadSchema.parse(await request.json().catch(() => ({})));
  user.role = body.role;

  return NextResponse.json({
    user,
    action: 'role_changed',
    totpVerified: true,
  });
}
