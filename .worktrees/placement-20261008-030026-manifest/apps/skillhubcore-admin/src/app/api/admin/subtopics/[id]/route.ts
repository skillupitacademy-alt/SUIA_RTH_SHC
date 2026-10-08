import { getDb, subtopics } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.topicId !== undefined) updateData.topicId = body.topicId;
    if (body.depth !== undefined) updateData.depth = normalizeDepth(body.depth);
    if (body.depthLevel !== undefined) updateData.depth = normalizeDepth(body.depthLevel);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.order !== undefined) updateData.order = body.order;
    void body.orderIndex;

    const [updated] = await db.update(subtopics).set(updateData).where(eq(subtopics.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating subtopic:', error);
    return NextResponse.json({ error: 'Failed to update subtopic' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db.delete(subtopics).where(eq(subtopics.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });

    return NextResponse.json({ message: 'Subtopic deleted successfully' });
  } catch (error) {
    console.error('Error deleting subtopic:', error);
    return NextResponse.json({ error: 'Failed to delete subtopic' }, { status: 500 });
  }
}

function normalizeDepth(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.round(numeric)) : 1;
}
