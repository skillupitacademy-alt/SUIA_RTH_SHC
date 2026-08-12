/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { domains, getDb, subjects, subtopics, topics } from '@quiz/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const topicId = searchParams.get('topicId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conditions = [];
    if (search) conditions.push(ilike(subtopics.name, `%${search}%`));
    if (topicId) conditions.push(eq(subtopics.topicId, topicId));

    const results = await db
      .select({
        subtopic: subtopics,
        topic: topics,
        subject: subjects,
        domain: domains,
      })
      .from(subtopics)
      .leftJoin(topics, eq(subtopics.topicId, topics.id))
      .leftJoin(subjects, eq(topics.subjectId, subjects.id))
      .leftJoin(domains, eq(subjects.domainId, domains.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(subtopics.createdAt))
      .limit(limit + 1);
    const hasMore = results.length > limit;
    const rows = hasMore ? results.slice(0, limit) : results;
    const data = rows.map(({ subtopic, topic, subject, domain }) => ({
      ...subtopic,
      topic: topic !== null ? {
        id: topic.id,
        name: topic.name,
        subjectId: topic.subjectId,
        subject: subject !== null ? {
          id: subject.id,
          name: subject.name,
          domainId: subject.domainId,
          domain: domain !== null ? {
            id: domain.id,
            name: domain.name,
          } : undefined,
        } : undefined,
      } : undefined,
    }));

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch subtopics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description, topicId, depth, depthLevel, status = 'active', order = 0 } = body;

    if (!name || !topicId) {
      return NextResponse.json({ error: 'Name and topicId required' }, { status: 400 });
    }

    const [newSubtopic] = await db.insert(subtopics).values({
      name,
      description,
      topicId,
      depth: normalizeDepth(depth ?? depthLevel),
      status,
      order,
    }).returning();
    return NextResponse.json(newSubtopic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create subtopic' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, description, depth, depthLevel, status, order } = body;

    if (!id) return NextResponse.json({ error: 'Subtopic ID required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (depth !== undefined) updateData.depth = normalizeDepth(depth);
    if (depthLevel !== undefined) updateData.depth = normalizeDepth(depthLevel);
    if (status !== undefined) updateData.status = status;
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
    const db = getDb();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      await db.delete(subtopics).where(inArray(subtopics.id, ids.split(',')));
      return NextResponse.json({ message: 'Subtopics deleted' });
    }

    await db.delete(subtopics).where(eq(subtopics.id, id!));
    return NextResponse.json({ message: 'Subtopic deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete subtopic' }, { status: 500 });
  }
}

function normalizeDepth(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(1, Math.round(numeric)) : 1;
}
