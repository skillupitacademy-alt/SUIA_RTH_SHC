import { NextResponse } from 'next/server';

import { findAdminUser } from '@/lib/skillhubcore-admin-data';
import { requireSuperAdmin } from '@/lib/skillhubcore-admin-guards';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const access = await requireSuperAdmin(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const { id } = await params;
  const user = findAdminUser(id);
  if (user === undefined) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
