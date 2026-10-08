import { NextResponse } from 'next/server';
import { asc, isNull } from 'drizzle-orm';

import { domains as shcDomains, getDb, subjects as shcSubjects, topics as shcTopics, subtopics as shcSubtopics } from '@quiz/db';

export const dynamic = 'force-dynamic';

function serializeDate(value: Date | null | undefined) {
  return value instanceof Date ? value.toISOString() : null;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function GET() {
  try {
    const db = getDb();
    const [domainRows, subjectRows, topicRows, subtopicRows] = await Promise.all([
      db.select().from(shcDomains).where(isNull(shcDomains.deletedAt)).orderBy(asc(shcDomains.order), asc(shcDomains.name)),
      db.select().from(shcSubjects).where(isNull(shcSubjects.deletedAt)).orderBy(asc(shcSubjects.order), asc(shcSubjects.name)),
      db.select().from(shcTopics).where(isNull(shcTopics.deletedAt)).orderBy(asc(shcTopics.order), asc(shcTopics.name)),
      db.select().from(shcSubtopics).where(isNull(shcSubtopics.deletedAt)).orderBy(asc(shcSubtopics.order), asc(shcSubtopics.name)),
    ]);

    return NextResponse.json({
      domains: domainRows
        .map((row) => ({
          id: row.id,
          name: row.name,
          slug: slugify(row.name),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      subjects: subjectRows
        .map((row) => ({
          id: row.id,
          domainId: row.domainId,
          name: row.name,
          slug: slugify(row.name),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      topics: topicRows
        .map((row) => ({
          id: row.id,
          subjectId: row.subjectId,
          name: row.name,
          slug: slugify(row.name),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      subtopics: subtopicRows
        .map((row) => ({
          id: row.id,
          topicId: row.topicId,
          name: row.name,
          slug: compactSlug(row.name),
          difficultyLevels: [],
          deletedAt: serializeDate(row.deletedAt),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
    });
  } catch (error) {
    console.error('[Tutorial Left Sidebar Hierarchy API] failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to load hierarchy.' }, { status: 500 });
  }
}
