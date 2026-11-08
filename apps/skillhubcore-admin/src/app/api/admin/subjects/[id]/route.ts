import { requireAdminRequest } from '@/lib/admin-route-guard';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { subjectSchema } from '@/schemas/hierarchy.schemas';
import { getDb, subjects } from '@quiz/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const { id } = await params;
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    if (
      sanitizedBody?.order !== undefined &&
      sanitizedBody?.orderIndex !== undefined &&
      sanitizedBody.order !== sanitizedBody.orderIndex
    ) {
      return NextResponse.json({ error: 'Conflicting order and orderIndex values' }, { status: 400 });
    }

    const normalizedInput = {
      ...sanitizedBody,
      ...(sanitizedBody?.order === undefined && sanitizedBody?.orderIndex !== undefined
        ? { order: sanitizedBody.orderIndex }
        : {}),
    };

    const parsed = subjectSchema.partial().safeParse(normalizedInput);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const body = parsed.data;
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.domainId !== undefined) updateData.domainId = body.domainId;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.order !== undefined) updateData.order = body.order;

    const db = getDb();
    const [updated] = await db.update(subjects).set(updateData).where(eq(subjects.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const accessDenied = await requireAdminRequest(_request);
  if (accessDenied) return accessDenied;

  try {
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db.delete(subjects).where(eq(subjects.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
