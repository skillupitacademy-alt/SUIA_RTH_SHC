import { db, topics } from '@quiz/db-skillhubcore';
import { eq, ilike, and, isNull, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const subjectId = searchParams.get('subjectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conditions = [isNull(topics.deletedAt)];
    if (search) conditions.push(ilike(topics.name, `%${search}%`));
    if (subjectId) conditions.push(eq(topics.subjectId, subjectId));

    const results = await db.select().from(topics).where(and(...conditions)).orderBy(desc(topics.createdAt)).limit(limit + 1);
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, subjectId, complexity = 'beginner', weight = '1.00', status = 'active', order = 0 } = body;

    if (!name || !subjectId) {
      return NextResponse.json({ error: 'Name and subjectId required' }, { status: 400 });
    }

    const [newTopic] = await db.insert(topics).values({ name, description, subjectId, complexity, weight, status, order }).returning();
    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, complexity, weight, status, order } = body;

    if (!id) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (complexity) updateData.complexity = complexity;
    if (weight) updateData.weight = weight;
    if (status) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const [updated] = await db.update(topics).set(updateData).where(eq(topics.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      await db.update(topics).set({ deletedAt: new Date() }).where(eq(topics.id, ids.split(',') as any));
      return NextResponse.json({ message: 'Topics deleted' });
    }

    await db.update(topics).set({ deletedAt: new Date() }).where(eq(topics.id, id!));
    return NextResponse.json({ message: 'Topic deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}