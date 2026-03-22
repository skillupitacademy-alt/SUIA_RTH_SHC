import { eq } from 'drizzle-orm';

import { db, domains, subjects, subtopics, topics, withTimeout, STANDARD_QUERY_TIMEOUT } from '@quiz/db';
import { TutorialContentRepository } from '@quiz/db-tutorial';

export interface TutorialHierarchyNode {
  id: string;
  name: string;
  slug: string;
}

export interface TutorialHierarchyPath {
  domain: TutorialHierarchyNode;
  subject: TutorialHierarchyNode;
  topic: TutorialHierarchyNode;
  subtopic: TutorialHierarchyNode;
}

export interface PublishedTutorialContent {
  id: string;
  subtopicId: string;
  difficulty: string;
  content: unknown;
  updatedAt: Date;
}

const repository = new TutorialContentRepository();

const hasDatabaseUrl = (): boolean => typeof process.env.DATABASE_URL === 'string' && process.env.DATABASE_URL.trim().length > 0;

export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findBySlug<T extends { id: string; name: string }>(rows: T[], slug: string): Promise<TutorialHierarchyNode | undefined> {
  const match = rows.find((row) => slugifySegment(row.name) === slug);
  if (match === undefined) {
    return undefined;
  }

  return {
    id: match.id,
    name: match.name,
    slug: slugifySegment(match.name),
  };
}

export async function getHierarchyBySlugs(params: {
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
}): Promise<TutorialHierarchyPath | null> {
  if (!hasDatabaseUrl()) {
    return null;
  }

  const domainRows = await withTimeout(
    db.select().from(domains),
    STANDARD_QUERY_TIMEOUT,
    'tutorial.hierarchy.domains'
  );
  const domain = await findBySlug(domainRows as Array<{ id: string; name: string }>, params.domainSlug);
  if (domain === undefined) {
    return null;
  }

  const subjectRows = await withTimeout(
    db.select().from(subjects).where(eq(subjects.domainId, domain.id)),
    STANDARD_QUERY_TIMEOUT,
    'tutorial.hierarchy.subjects'
  );
  const subject = await findBySlug(subjectRows as Array<{ id: string; name: string }>, params.subjectSlug);
  if (subject === undefined) {
    return null;
  }

  const topicRows = await withTimeout(
    db.select().from(topics).where(eq(topics.subjectId, subject.id)),
    STANDARD_QUERY_TIMEOUT,
    'tutorial.hierarchy.topics'
  );
  const topic = await findBySlug(topicRows as Array<{ id: string; name: string }>, params.topicSlug);
  if (topic === undefined) {
    return null;
  }

  const subtopicRows = await withTimeout(
    db.select().from(subtopics).where(eq(subtopics.topicId, topic.id)),
    STANDARD_QUERY_TIMEOUT,
    'tutorial.hierarchy.subtopics'
  );
  const subtopic = await findBySlug(subtopicRows as Array<{ id: string; name: string }>, params.subtopicSlug);
  if (subtopic === undefined) {
    return null;
  }

  return {
    domain,
    subject,
    topic,
    subtopic,
  };
}

export async function getPublishedTutorialContent(subtopicId: string, difficulty?: 'simple' | 'mixed' | 'intermediate' | 'expert') {
  const rows = await repository.getPublished(subtopicId, difficulty);
  const content = rows[0];
  if (content === undefined) {
    return null;
  }

  return {
    id: content.id,
    subtopicId: content.subtopicId,
    difficulty: content.difficulty,
    content: content.content,
    updatedAt: content.updatedAt,
  } satisfies PublishedTutorialContent;
}

export async function getPublishedTutorialPaths() {
  if (!hasDatabaseUrl()) {
    return [];
  }

  const domainRows = await withTimeout(db.select().from(domains), STANDARD_QUERY_TIMEOUT, 'tutorial.sitemap.domains');
  const subjectRows = await withTimeout(db.select().from(subjects), STANDARD_QUERY_TIMEOUT, 'tutorial.sitemap.subjects');
  const topicRows = await withTimeout(db.select().from(topics), STANDARD_QUERY_TIMEOUT, 'tutorial.sitemap.topics');
  const subtopicRows = await withTimeout(db.select().from(subtopics), STANDARD_QUERY_TIMEOUT, 'tutorial.sitemap.subtopics');

  const hierarchy = {
    domains: domainRows as Array<{ id: string; name: string }>,
    subjects: subjectRows as Array<{ id: string; domainId: string; name: string }>,
    topics: topicRows as Array<{ id: string; subjectId: string; name: string; updatedAt?: Date }>,
    subtopics: subtopicRows as Array<{ id: string; topicId: string; name: string; updatedAt?: Date }>,
  };

  const paths: Array<{
    domainSlug: string;
    subjectSlug: string;
    topicSlug: string;
    subtopicSlug: string;
    subtopicId: string;
    updatedAt?: Date;
  }> = [];

  for (const domain of hierarchy.domains) {
    const domainSlug = slugifySegment(domain.name);
    const subjectMatches = hierarchy.subjects.filter((subject) => subject.domainId === domain.id);
    for (const subject of subjectMatches) {
      const subjectSlug = slugifySegment(subject.name);
      const topicMatches = hierarchy.topics.filter((topic) => topic.subjectId === subject.id);
      for (const topic of topicMatches) {
        const topicSlug = slugifySegment(topic.name);
        const subtopicMatches = hierarchy.subtopics.filter((subtopic) => subtopic.topicId === topic.id);
        for (const subtopic of subtopicMatches) {
          const published = await repository.getPublished(subtopic.id);
          if (published.length === 0) {
            continue;
          }

          paths.push({
            domainSlug,
            subjectSlug,
            topicSlug,
            subtopicSlug: slugifySegment(subtopic.name),
            subtopicId: subtopic.id,
            updatedAt: published[0]?.updatedAt ?? subtopic.updatedAt,
          });
        }
      }
    }
  }

  return paths;
}
