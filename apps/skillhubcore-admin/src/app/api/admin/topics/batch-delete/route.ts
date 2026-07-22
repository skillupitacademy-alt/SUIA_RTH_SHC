import { getDb, topics } from '@quiz/db-skillhubcore';
import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Topic IDs are required' }, { status: 400 });
    }

    await getDb().update(topics).set({ deletedAt: new Date() }).where(inArray(topics.id, ids));
    return NextResponse.json({ message: `${ids.length} topics deleted successfully` });
  } catch (error) {
    console.error('Error batch deleting topics:', error);
    return NextResponse.json({ error: 'Failed to delete topics' }, { status: 500 });
  }
}
