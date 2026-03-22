import { NextResponse } from 'next/server';

import { adminAuditLogs } from '@/lib/skillhubcore-admin-data';
import { requireSuperAdmin } from '@/lib/skillhubcore-admin-guards';

export async function GET(request: Request) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const url = new URL(request.url);
  const actor = url.searchParams.get('actor')?.toLowerCase() ?? '';
  const action = url.searchParams.get('action')?.toLowerCase() ?? '';
  const platform = url.searchParams.get('platform')?.toLowerCase() ?? '';

  const logs = adminAuditLogs.filter((entry) => {
    const actorMatches = actor.length === 0 || entry.actor.toLowerCase().includes(actor);
    const actionMatches = action.length === 0 || entry.action.toLowerCase().includes(action);
    const platformMatches = platform.length === 0 || entry.platform.toLowerCase().includes(platform);
    return actorMatches && actionMatches && platformMatches;
  });

  return NextResponse.json({ logs });
}
