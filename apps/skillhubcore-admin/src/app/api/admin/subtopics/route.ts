import { requireAdminRequest } from '@/lib/admin-route-guard';
import { AcademicHierarchyService } from '@/lib/hierarchy/academic-hierarchy.service';
import { parsePaginationLimit } from '@/lib/pagination-helper';
import { sanitizeJsonField, validateJsonDepth, validateJsonSize } from '@/lib/sanitize';
import { subtopicSchema } from '@/schemas/hierarchy.schemas';
import { domains, getDb, subjects, subtopics, topics } from '@quiz/db';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

function serializeSubtopic<T extends { depth?: number | null; order?: number | null }>(row: T) {
  return {
    ...row,
    depth: row.depth ?? 1,
    depthLevel: row.depth ?? 1,
    order: row.order ?? 0,
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
    const topicId = searchParams.get('topicId');
    const limit = parsePaginationLimit(searchParams.get('limit'));

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
      ...serializeSubtopic(subtopic),
      topic:
        topic !== null
          ? {
              id: topic.id,
              name: topic.name,
              subjectId: topic.subjectId,
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
            }
          : undefined,
    }));

    return NextResponse.json({ data, nextCursor: hasMore ? data[data.length - 1]?.id : null, hasMore });
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    return NextResponse.json({ error: 'Failed to fetch subtopics' }, { status: 500 });
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
    const parsed = subtopicSchema.safeParse(sanitizedBody);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const newSubtopic = await AcademicHierarchyService.createSubtopic(parsed.data);

    return NextResponse.json(newSubtopic ? serializeSubtopic(newSubtopic) : newSubtopic, { status: 201 });
  } catch (error) {
    console.error('Error creating subtopic:', error);
    return NextResponse.json({ error: 'Failed to create subtopic' }, { status: 500 });
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

    if (!id) return NextResponse.json({ error: 'Subtopic ID required' }, { status: 400 });

    const parsed = subtopicSchema.partial().safeParse(sanitizedBody);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.issues }, { status: 400 });
    }

    const updated = await AcademicHierarchyService.updateSubtopic(id, parsed.data);

    if (!updated) return NextResponse.json({ error: 'Subtopic not found' }, { status: 404 });

    return NextResponse.json(serializeSubtopic(updated));
  } catch (error) {
    console.error('Error updating subtopic:', error);
    return NextResponse.json({ error: 'Failed to update subtopic' }, { status: 500 });
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
      const result = await AcademicHierarchyService.batchDeleteSubtopics({ ids: idArray });
      return NextResponse.json(
        result.status === 200 ? { message: result.message } : result,
        { status: result.status }
      );
    } else {
      const result = await AcademicHierarchyService.deleteSubtopic(id!);
      return NextResponse.json(
        result.status === 200 ? { message: result.message } : result,
        { status: result.status }
      );
    }
  } catch (error) {
    console.error('Error deleting subtopic:', error);
    return NextResponse.json({ error: 'Failed to delete subtopic' }, { status: 500 });
  }
}
