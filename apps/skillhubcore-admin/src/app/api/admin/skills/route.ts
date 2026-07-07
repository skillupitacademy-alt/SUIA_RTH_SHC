import { db, skills } from '@quiz/db-skillhubcore';
import { eq, ilike, and, isNull, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conditions = [isNull(skills.deletedAt)];
    if (search) conditions.push(ilike(skills.name, `%${search}%`));
    if (category) conditions.push(eq(skills.category, category as any));

    const results = await db.select().from(skills).where(and(...conditions)).orderBy(desc(skills.createdAt)).limit(limit + 1);
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, category, weight = '1.00', status = 'active' } = body;

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category required' }, { status: 400 });
    }

    const [newSkill] = await db.insert(skills).values({ name, description, category, weight, status }).returning();
    return NextResponse.json(newSkill, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, category, weight, status } = body;

    if (!id) return NextResponse.json({ error: 'Skill ID required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;
    if (weight) updateData.weight = weight;
    if (status) updateData.status = status;

    const [updated] = await db.update(skills).set(updateData).where(eq(skills.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Skill not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      await db.update(skills).set({ deletedAt: new Date() }).where(eq(skills.id, ids.split(',') as any));
      return NextResponse.json({ message: 'Skills deleted' });
    }

    await db.update(skills).set({ deletedAt: new Date() }).where(eq(skills.id, id!));
    return NextResponse.json({ message: 'Skill deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}