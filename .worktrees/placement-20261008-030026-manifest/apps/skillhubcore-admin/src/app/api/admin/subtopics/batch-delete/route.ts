import { getDb, subtopics } from '@quiz/db';
import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Subtopic IDs are required' }, { status: 400 });
    }

    await getDb().delete(subtopics).where(inArray(subtopics.id, ids));
    return NextResponse.json({ message: `${ids.length} subtopics deleted successfully` });
  } catch (error) {
    console.error('Error batch deleting subtopics:', error);
    return NextResponse.json({ error: 'Failed to delete subtopics' }, { status: 500 });
  }
}
