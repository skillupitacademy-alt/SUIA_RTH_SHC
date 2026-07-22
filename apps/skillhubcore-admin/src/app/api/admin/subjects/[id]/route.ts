import { getDb, subjects } from '@quiz/db-skillhubcore';
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
    if (body.domainId !== undefined) updateData.domainId = body.domainId;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.order !== undefined) updateData.order = body.order;
    if (body.orderIndex !== undefined) updateData.order = body.orderIndex;

    const [updated] = await db.update(subjects).set(updateData).where(eq(subjects.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db.update(subjects).set({ deletedAt: new Date() }).where(eq(subjects.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
