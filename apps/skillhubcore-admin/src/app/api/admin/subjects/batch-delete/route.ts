import { getDb, subjects } from '@quiz/db-skillhubcore';
import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Subject IDs are required' }, { status: 400 });
    }

    await getDb().update(subjects).set({ deletedAt: new Date() }).where(inArray(subjects.id, ids));
    return NextResponse.json({ message: `${ids.length} subjects deleted successfully` });
  } catch (error) {
    console.error('Error batch deleting subjects:', error);
    return NextResponse.json({ error: 'Failed to delete subjects' }, { status: 500 });
  }
}
