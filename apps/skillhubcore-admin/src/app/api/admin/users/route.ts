import { NextResponse } from 'next/server';

import { adminUsers } from '@/lib/skillhubcore-admin-data';
import { requireSuperAdmin } from '@/lib/skillhubcore-admin-guards';

export async function GET(request: Request) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.toLowerCase() ?? '';

  const users = search.length === 0
    ? adminUsers
    : adminUsers.filter((user) =>
        user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search),
      );

  return NextResponse.json({ users });
}
