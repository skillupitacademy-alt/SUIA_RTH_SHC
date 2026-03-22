import { NextResponse } from 'next/server';
import { z } from 'zod';

import { findAdminSubscription } from '@/lib/skillhubcore-admin-data';
import { requireSuperAdmin, requireTotp } from '@/lib/skillhubcore-admin-guards';

const payloadSchema = z.object({
  plan: z.enum(['free', 'premium', 'combo', 'training']).optional(),
  status: z.enum(['active', 'expired', 'cancelled']).optional(),
});

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const totp = requireTotp(request);
  if (totp instanceof NextResponse) {
    return totp;
  }

  const { id } = await params;
  const subscription = findAdminSubscription(id);
  if (subscription === undefined) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = payloadSchema.parse(await request.json().catch(() => ({})));
  if (body.plan !== undefined) {
    subscription.plan = body.plan;
  }
  if (body.status !== undefined) {
    subscription.status = body.status;
  }

  return NextResponse.json({
    subscription,
    totpVerified: true,
  });
}
