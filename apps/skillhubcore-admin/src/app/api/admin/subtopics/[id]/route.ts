import { requireAdminRequest } from '@/lib/admin-route-guard';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { subtopicSchema } from '@/schemas/hierarchy.schemas';
import { getDb, subtopics } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

function serializeSubtopic<T extends { depth?: number | null; order?: number | null }>(row: T) {
  return {
    ...row,
    depth: row.depth ?? 1,
    depthLevel: row.depth ?? 1,
    order: row.order ?? 0,
    orderIndex: row.order ?? 0,
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const { id } = await params;
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = subtopicSchema.partial().safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const body = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.topicId !== undefined) updateData.topicId = body.topicId;
    if (body.depth !== undefined || body.depthLevel !== undefined) {
      updateData.depth = body.depth ?? body.depthLevel;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.order !== undefined || body.orderIndex !== undefined) {
      updateData.order = body.order ?? body.orderIndex;
    }

    const db = getDb();
    const [updated] = await db.update(subtopics).set(updateData).where(eq(subtopics.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });

    return NextResponse.json(serializeSubtopic(updated));
  } catch (error) {
    console.error('Error updating subtopic:', error);
    return NextResponse.json({ error: 'Failed to update subtopic' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(_request);
  if (accessDenied) return accessDenied;

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
