import { requireAdminRequest } from '@/lib/admin-route-guard';
import { AcademicHierarchyService, normalizeComplexity } from '@/lib/hierarchy/academic-hierarchy.service';
import { parsePaginationLimit } from '@/lib/pagination-helper';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { TOPIC_COMPLEXITY_ENUM_TO_LEVEL, topicSchema } from '@/schemas/hierarchy.schemas';
import { domains, getDb, subjects, topics } from '@quiz/db';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';


function serializeTopic<T extends { complexity?: string | null; order?: number | null }>(row: T) {
  const normalizedComplexity = normalizeComplexity(row.complexity ?? 'beginner');
  return {
    ...row,
    complexity: row.complexity ?? normalizedComplexity,
    complexityLevel: TOPIC_COMPLEXITY_ENUM_TO_LEVEL[normalizedComplexity] ?? 1,
    orderIndex: row.order ?? 0,
  };
}

export async function GET(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const db = getDb();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const subjectId = searchParams.get('subjectId');
    const limit = parsePaginationLimit(searchParams.get('limit'));

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
      ...serializeTopic(topic),
      subject:
        subject !== null
          ? {
            id: subject.id,
            name: subject.name,
            domainId: subject.domainId,
            domain:
              domain !== null
                ? {
                  id: domain.id,
                  name: domain.name,
                }
                : undefined,
          }
          : undefined,
    }));

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody);
    const parsed = topicSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const newTopic = await AcademicHierarchyService.createTopic(parsed.data);

    return NextResponse.json(newTopic ? serializeTopic(newTopic) : newTopic, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const rawBody = await request.json();

    if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
      return NextResponse.json({ error: 'Payload too deep or large' }, { status: 400 });
    }

    const sanitizedBody = sanitizeJsonField(rawBody) as Record<string, unknown>;
    const id = typeof sanitizedBody?.id === 'string' ? sanitizedBody.id : '';

    if (!id) return NextResponse.json({ error: 'Topic ID required' }, { status: 400 });

    const parsed = topicSchema.partial().safeParse(sanitizedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const updated = await AcademicHierarchyService.updateTopic(id, parsed.data);

    if (!updated) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    return NextResponse.json(serializeTopic(updated));
  } catch (error) {
    console.error('Error updating topic:', error);
    return NextResponse.json({ error: 'Failed to update topic' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const accessDenied = await requireAdminRequest(request);
  if (accessDenied) return accessDenied;

  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    const ids = searchParams.get('ids');

    if (!id && !ids) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (ids) {
      const idArray = ids.split(',').map((s) => s.trim()).filter(Boolean);
      const result = await AcademicHierarchyService.batchDeleteTopics({ ids: idArray });
      return NextResponse.json(
        result.status === 200 ? { message: result.message } : result,
        { status: result.status }
      );
    } else {
      const result = await AcademicHierarchyService.deleteTopic(id!);
      return NextResponse.json(
        result.status === 200 ? { message: result.message } : result,
        { status: result.status }
      );
    }
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
