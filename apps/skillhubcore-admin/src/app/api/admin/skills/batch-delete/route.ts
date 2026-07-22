import { getDb, skills } from '@quiz/db-skillhubcore';
import { inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json() as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Skill IDs are required' }, { status: 400 });
    }

    await getDb().update(skills).set({ deletedAt: new Date() }).where(inArray(skills.id, ids));
    return NextResponse.json({ message: `${ids.length} skills deleted successfully` });
  } catch (error) {
    console.error('Error batch deleting skills:', error);
    return NextResponse.json({ error: 'Failed to delete skills' }, { status: 500 });
  }
}
