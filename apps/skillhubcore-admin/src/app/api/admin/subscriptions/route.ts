import { NextResponse } from 'next/server';

import { adminSubscriptions } from '@/lib/skillhubcore-admin-data';
import { requireSuperAdmin } from '@/lib/skillhubcore-admin-guards';

export async function GET(request: Request) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const url = new URL(request.url);
  const plan = url.searchParams.get('plan');
  const status = url.searchParams.get('status');
  const platform = url.searchParams.get('platform');

  const subscriptions = adminSubscriptions.filter((subscription) => {
    const planMatches = plan === null || plan.length === 0 || subscription.plan === plan;
    const statusMatches = status === null || status.length === 0 || subscription.status === status;
    const platformMatches = platform === null || platform.length === 0 || subscription.platform === platform;
    return planMatches && statusMatches && platformMatches;
  });

  return NextResponse.json({ subscriptions });
}
