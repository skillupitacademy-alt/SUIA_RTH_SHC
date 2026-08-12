import { getDb, skills } from '@quiz/db';
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
    if (body.category !== undefined) updateData.category = body.category;
    void body.mappingType;
    if (body.weight !== undefined) updateData.weight = Number.isFinite(Number(body.weight)) ? Number(body.weight) : 1;
    if (body.status !== undefined) updateData.status = body.status;

    const [updated] = await db.update(skills).set(updateData).where(eq(skills.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const [deleted] = await db.delete(skills).where(eq(skills.id, id)).returning();
    if (!deleted) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    return NextResponse.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
