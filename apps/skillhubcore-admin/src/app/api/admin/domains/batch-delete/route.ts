import { domains, getDb } from '@quiz/db';
import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Domain IDs are required' }, { status: 400 });
    }

    await getDb().delete(domains).where(inArray(domains.id, ids));
    return NextResponse.json({ message: `${ids.length} domains deleted successfully` });
  } catch (error) {
    console.error('Error batch deleting domains:', error);
    return NextResponse.json({ error: 'Failed to delete domains' }, { status: 500 });
  }
}
