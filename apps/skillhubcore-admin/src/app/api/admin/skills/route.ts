/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { getDb, skills } from '@quiz/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conditions = [];
    if (search) conditions.push(ilike(skills.name, `%${search}%`));
    if (category) conditions.push(eq(skills.category, category as any));

    const results = await db.select().from(skills).where(conditions.length > 0 ? and(...conditions) : undefined).orderBy(desc(skills.createdAt)).limit(limit + 1);
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description, category, weight = 1, status = 'active' } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category required' }, { status: 400 });
    }

    const [newSkill] = await db.insert(skills).values({
      name,
      description,
      category,
      weight: Number.isFinite(Number(weight)) ? Number(weight) : 1,
      status,
    }).returning();
    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, description, category, mappingType, weight, status } = body;

    if (!id) return NextResponse.json({ error: 'Skill ID required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    void mappingType;
    if (weight) updateData.weight = Number.isFinite(Number(weight)) ? Number(weight) : 1;
    if (status !== undefined) updateData.status = status;

    const [updated] = await db.update(skills).set(updateData).where(eq(skills.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      await db.delete(skills).where(inArray(skills.id, ids.split(',')));
      return NextResponse.json({ message: 'Skills deleted' });
    }

    await db.delete(skills).where(eq(skills.id, id!));
    return NextResponse.json({ message: 'Skill deleted' });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
