import { NextResponse } from 'next/server';

import { dbHttp, tutorialDomains, tutorialSubjects, tutorialTopics, tutorialSubtopics } from '@quiz/db-tutorial';

export const dynamic = 'force-dynamic';

function serializeDate(value: Date | null | undefined) {
  return value instanceof Date ? value.toISOString() : null;
}

export async function GET() {
  try {
    const [domains, subjects, topics, subtopics] = await Promise.all([
      dbHttp.select().from(tutorialDomains),
      dbHttp.select().from(tutorialSubjects),
      dbHttp.select().from(tutorialTopics),
      dbHttp.select().from(tutorialSubtopics),
    ]);

    return NextResponse.json({
      domains: domains
        .filter((row) => row.deletedAt == null)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((row) => ({
          id: row.id,
          name: row.name,
          slug: row.slug,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      subjects: subjects
        .filter((row) => row.deletedAt == null)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((row) => ({
          id: row.id,
          domainId: row.domainId,
          name: row.name,
          slug: row.slug,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      topics: topics
        .filter((row) => row.deletedAt == null)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((row) => ({
          id: row.id,
          subjectId: row.subjectId,
          name: row.name,
          slug: row.slug,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        })),
      subtopics: subtopics
        .filter((row) => row.deletedAt == null)
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((row) => ({
          id: row.id,
          topicId: row.topicId,
          name: row.name,
          slug: row.slug,
          difficultyLevels: row.difficultyLevels,
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
