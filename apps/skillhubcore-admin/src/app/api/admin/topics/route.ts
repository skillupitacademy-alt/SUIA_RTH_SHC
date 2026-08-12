/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { domains, getDb, subjects, topics } from '@quiz/db';
import { and, desc, eq, ilike, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const subjectId = searchParams.get('subjectId');
    const limit = parseInt(searchParams.get('limit') || '20');

    const conditions = [];
    if (search) conditions.push(ilike(topics.name, `%${search}%`));
    if (subjectId) conditions.push(eq(topics.subjectId, subjectId));

    const results = await db
      .select({
        topic: topics,
        subject: subjects,
        domain: domains,
      })
      .from(topics)
      .leftJoin(subjects, eq(topics.subjectId, subjects.id))
      .leftJoin(domains, eq(subjects.domainId, domains.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(topics.createdAt))
      .limit(limit + 1);
    const hasMore = results.length > limit;
    const rows = hasMore ? results.slice(0, limit) : results;
    const data = rows.map(({ topic, subject, domain }) => ({
      ...topic,
      subject: subject !== null ? {
        id: subject.id,
        name: subject.name,
        domainId: subject.domainId,
        domain: domain !== null ? {
          id: domain.id,
          name: domain.name,
        } : undefined,
      } : undefined,
    }));

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { name, description, subjectId, complexity, complexityLevel, weight = 1, status = 'active', order = 0 } = body;

    if (!name || !subjectId) {
      return NextResponse.json({ error: 'Name and subjectId required' }, { status: 400 });
    }

    const [newTopic] = await db.insert(topics).values({
      name,
      description,
      subjectId,
      complexity: normalizeComplexity(complexity ?? complexityLevel),
      weight: Number.isFinite(Number(weight)) ? Number(weight) : 1,
      order,
      status,
    }).returning();
    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const { id, name, description, complexity, complexityLevel, weight, status, order } = body;

    if (!id) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (complexity !== undefined) updateData.complexity = normalizeComplexity(complexity);
    if (complexityLevel !== undefined) updateData.complexity = normalizeComplexity(complexityLevel);
    if (weight !== undefined) updateData.weight = Number.isFinite(Number(weight)) ? Number(weight) : 1;
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
    const db = getDb();
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      await db.delete(topics).where(inArray(topics.id, ids.split(',')));
      return NextResponse.json({ message: 'Topics deleted' });
    }

    await db.delete(topics).where(eq(topics.id, id!));
    return NextResponse.json({ message: 'Topic deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}

function normalizeComplexity(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 3) return 'advanced';
    if (value === 2) return 'intermediate';
    return 'beginner';
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'expert' || normalized === 'advanced') return 'advanced';
    if (normalized === 'intermediate') return 'intermediate';
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeComplexity(numeric);
  }
  return 'beginner';
}
