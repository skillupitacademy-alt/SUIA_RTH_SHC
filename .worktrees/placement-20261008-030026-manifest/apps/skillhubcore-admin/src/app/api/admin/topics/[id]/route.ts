import { getDb, topics } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

function normalizeComplexity(value: unknown) {
  if (typeof value === 'number') {
    if (value >= 3) return 'advanced';
    if (value === 2) return 'intermediate';
    return 'beginner';
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'expert' || normalized === 'advanced') return 'advanced';
    if (normalized === 'intermediate') return 'intermediate';
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeComplexity(numeric);
  }
  return 'beginner';
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.subjectId !== undefined) updateData.subjectId = body.subjectId;
    if (body.complexity !== undefined) updateData.complexity = normalizeComplexity(body.complexity);
    if (body.complexityLevel !== undefined) updateData.complexity = normalizeComplexity(body.complexityLevel);
    if (body.weight !== undefined) updateData.weight = Number.isFinite(Number(body.weight)) ? Number(body.weight) : 1;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.order !== undefined) updateData.order = body.order;
    void body.orderIndex;

    const [updated] = await db.update(topics).set(updateData).where(eq(topics.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db.delete(topics).where(eq(topics.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
