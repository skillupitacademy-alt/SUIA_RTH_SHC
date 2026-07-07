import { db, subtopics } from '@quiz/db-skillhubcore';
import { eq, ilike, and, isNull, desc } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const topicId = searchParams.get('topicId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conditions = [isNull(subtopics.deletedAt)];
    if (search) conditions.push(ilike(subtopics.name, `%${search}%`));
    if (topicId) conditions.push(eq(subtopics.topicId, topicId));

    const results = await db.select().from(subtopics).where(and(...conditions)).orderBy(desc(subtopics.createdAt)).limit(limit + 1);
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subtopics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, topicId, depth = 1, status = 'active', order = 0 } = body;

    if (!name || !topicId) {
      return NextResponse.json({ error: 'Name and topicId required' }, { status: 400 });
    }

    const [newSubtopic] = await db.insert(subtopics).values({ name, description, topicId, depth, status, order }).returning();
    return NextResponse.json(newSubtopic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subtopic' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, depth, status, order } = body;

    if (!id) return NextResponse.json({ error: 'Subtopic ID required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (depth) updateData.depth = depth;
    if (status) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const [updated] = await db.update(subtopics).set(updateData).where(eq(subtopics.id, id)).returning();
    if (!updated) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update subtopic' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      await db.update(subtopics).set({ deletedAt: new Date() }).where(eq(subtopics.id, ids.split(',') as any));
      return NextResponse.json({ message: 'Subtopics deleted' });
    }

    await db.update(subtopics).set({ deletedAt: new Date() }).where(eq(subtopics.id, id!));
    return NextResponse.json({ message: 'Subtopic deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subtopic' }, { status: 500 });
  }
}