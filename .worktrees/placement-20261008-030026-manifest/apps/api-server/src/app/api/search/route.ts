import { dbReadOnly, domains, questions, subjects, topics } from '@quiz/db';
import { desc, eq, ilike, or } from 'drizzle-orm';
import { type NextRequest } from 'next/server';

import { ApiResponse } from '@/lib/api-response';
import { withLogging } from '@/lib/withLogging';
import { withRateLimit } from '@/middleware/rate-limit.middleware';

export const dynamic = 'force-dynamic';

type SearchKind = 'topic' | 'question';

type SearchResult = {
  id: string;
  kind: SearchKind;
  label: string;
  path: string;
  meta?: string;
};

function normalizeQuery(input: string | null): string {
  return typeof input === 'string' ? input.trim() : '';
}

function buildMeta(...parts: Array<string | null | undefined>): string | undefined {
  const filtered = parts.map((part) => typeof part === 'string' ? part.trim() : '').filter((part) => part.length > 0);
  return filtered.length > 0 ? filtered.join(' · ') : undefined;
}

async function getHandler(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const query = normalizeQuery(searchParams.get('q'));
  const type = searchParams.get('type')?.trim().toLowerCase() ?? 'all';

  if (query.length < 2) {
    return ApiResponse.success({ results: [] satisfies SearchResult[] });
  }

  const results: SearchResult[] = [];
  const queryPattern = `%${query}%`;

  if (type === 'all' || type === 'topic') {
    const topicRows = await dbReadOnly
      .select({
        id: topics.id,
        name: topics.name,
        description: topics.description,
        subjectName: subjects.name,
        domainName: domains.name,
      })
      .from(topics)
      .leftJoin(subjects, eq(topics.subjectId, subjects.id))
      .leftJoin(domains, eq(subjects.domainId, domains.id))
      .where(or(ilike(topics.name, queryPattern), ilike(topics.description, queryPattern)))
      .orderBy(desc(topics.updatedAt))
      .limit(10);

    results.push(...topicRows.map((row): SearchResult => ({
      id: row.id,
      kind: 'topic',
      label: row.name,
      path: `/quiz/new?topicId=${encodeURIComponent(row.id)}`,
      meta: buildMeta(row.domainName, row.subjectName),
    })));
  }

  if (type === 'all' || type === 'question') {
    const questionRows = await dbReadOnly
      .select({
        id: questions.id,
        questionText: questions.questionText,
        topicId: questions.topicId,
        topicName: topics.name,
        subjectName: subjects.name,
        domainName: domains.name,
      })
      .from(questions)
      .leftJoin(topics, eq(questions.topicId, topics.id))
      .leftJoin(subjects, eq(topics.subjectId, subjects.id))
      .leftJoin(domains, eq(subjects.domainId, domains.id))
      .where(or(ilike(questions.questionText, queryPattern), ilike(questions.explanation, queryPattern)))
      .orderBy(desc(questions.createdAt))
      .limit(10);

    results.push(...questionRows.map((row): SearchResult => ({
      id: row.id,
      kind: 'question',
      label: row.questionText,
      path: `/quiz/new?topicId=${encodeURIComponent(row.topicId)}`,
      meta: buildMeta(row.domainName, row.subjectName, row.topicName),
    })));
  }

  return ApiResponse.success({ results: results.slice(0, 20) });
}

export const GET = withRateLimit(
  withLogging(getHandler, { component: 'search', operation: 'search_global' }),
  { limit: 60, windowMs: 60 * 1000, keyPrefix: 'ratelimit:search' }
);
