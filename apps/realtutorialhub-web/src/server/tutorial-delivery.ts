import { unstable_cache } from 'next/cache';
import { Redis } from '@upstash/redis';
import { and, eq, inArray } from 'drizzle-orm';

import {
  db as tutorialDb,
  tutorialSections,
  tutorialSubtopics,
} from '@quiz/db-tutorial';
import type { TutorialDifficulty, TutorialSectionId, TutorialContentJSON } from '@quiz/types';
import { TUTORIAL_SECTION_CONTRACTS } from '@quiz/types';
import {
  formatTutorialSectionValidationIssues,
  validateTutorialSection,
  type TutorialSectionValidationIssue,
} from '@quiz/validation';

import {
  getHierarchyBySlugs,
  getPublishedTutorialPaths,
  type TutorialHierarchyPath,
} from '@/lib/tutorial-hierarchy';

type SectionRecord = {
  id: string;
  sectionType: TutorialSectionId;
  content: unknown;
  version: number;
  language: string;
};

export interface TutorialSectionsResponse {
  subtopicId: string;
  subtopicName: string;
  difficulty: TutorialDifficulty;
  totalSections: number;
  sections: Record<string, unknown>;
  sectionMeta: Record<string, { id: string; version: number; language: string }>;
}

export interface TutorialSectionError {
  sectionType: TutorialSectionId;
  issues: TutorialSectionValidationIssue[];
}

export interface ValidatedTutorialSectionsPayload {
  subtopicId: string;
  subtopicName: string;
  difficulty: TutorialDifficulty;
  sectionMeta: Record<string, { id: string; version: number; language: string }>;
  sections: Partial<Record<TutorialSectionId, unknown>>;
  invalidSections: TutorialSectionError[];
}

const CACHE_VERSION = 'v2';
const SECTION_TTL_SECONDS = 900;
const HIERARCHY_TTL_SECONDS = 1800;
const PUBLISHED_PATHS_TTL_SECONDS = 3600;

let redisClient: Redis | null | undefined;

function getOptionalRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

async function readRedisJson<T>(key: string): Promise<T | null> {
  const redis = getOptionalRedis();
  if (redis === null) {
    return null;
  }

  try {
    const value = await redis.get<T>(key);
    return value ?? null;
  } catch {
    return null;
  }
}

async function writeRedisJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getOptionalRedis();
  if (redis === null) {
    return;
  }

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch {
    // Best-effort cache write.
  }
}

function getSectionsCacheKey(subtopicSlug: string, difficulty: TutorialDifficulty): string {
  return `tutorial:${CACHE_VERSION}:sections:${subtopicSlug}:${difficulty}`;
}

function getHierarchyCacheKey(domainSlug: string, subjectSlug: string, topicSlug: string, subtopicSlug: string): string {
  return `tutorial:${CACHE_VERSION}:hierarchy:${domainSlug}:${subjectSlug}:${topicSlug}:${subtopicSlug}`;
}

function getPathsCacheKey(): string {
  return `tutorial:${CACHE_VERSION}:paths`;
}

async function fetchPublishedSectionsBySubtopicSlug(
  subtopicSlug: string,
  difficulty: TutorialDifficulty = 'simple'
): Promise<TutorialSectionsResponse | null> {
  const [subtopic] = await tutorialDb
    .select({
      id: tutorialSubtopics.id,
      name: tutorialSubtopics.name,
      slug: tutorialSubtopics.slug,
    })
    .from(tutorialSubtopics)
    .where(eq(tutorialSubtopics.slug, subtopicSlug))
    .limit(1);

  if (!subtopic) {
    return null;
  }

  const rows = await tutorialDb
    .select({
      id: tutorialSections.id,
      sectionType: tutorialSections.sectionType,
      content: tutorialSections.content,
      version: tutorialSections.version,
      language: tutorialSections.language,
    })
    .from(tutorialSections)
    .where(
      and(
        eq(tutorialSections.subtopicId, subtopic.id),
        eq(tutorialSections.difficulty, difficulty),
        inArray(tutorialSections.status, ['approved', 'deployed'])
      )
    );

  const sections: Record<string, unknown> = {};
  const sectionMeta: Record<string, { id: string; version: number; language: string }> = {};

  for (const row of rows as SectionRecord[]) {
    sections[row.sectionType] = row.content;
    sectionMeta[row.sectionType] = {
      id: row.id,
      version: row.version,
      language: row.language,
    };
  }

  return {
    subtopicId: subtopic.id,
    subtopicName: subtopic.name,
    difficulty,
    totalSections: rows.length,
    sections,
    sectionMeta,
  };
}

async function getPublishedSectionsBySubtopicSlugCached(
  subtopicSlug: string,
  difficulty: TutorialDifficulty = 'simple'
) {
  const redisKey = getSectionsCacheKey(subtopicSlug, difficulty);
  const cached = await readRedisJson<TutorialSectionsResponse>(redisKey);
  if (cached !== null) {
    return cached;
  }

  const result = await fetchPublishedSectionsBySubtopicSlug(subtopicSlug, difficulty);
  if (result !== null) {
    await writeRedisJson(redisKey, result, SECTION_TTL_SECONDS);
  }

  return result;
}

const getHierarchyBySlugsCached = unstable_cache(
  async (domainSlug: string, subjectSlug: string, topicSlug: string, subtopicSlug: string) => {
    const redisKey = getHierarchyCacheKey(domainSlug, subjectSlug, topicSlug, subtopicSlug);
    const cached = await readRedisJson<TutorialHierarchyPath>(redisKey);
    if (cached !== null) {
      return cached;
    }

    const result = await getHierarchyBySlugs({ domainSlug, subjectSlug, topicSlug, subtopicSlug });
    if (result !== null) {
      await writeRedisJson(redisKey, result, HIERARCHY_TTL_SECONDS);
    }

    return result;
  },
  ['tutorial-delivery-hierarchy'],
  { revalidate: 1800 }
);

const getPublishedTutorialPathsCached = unstable_cache(
  async () => {
    const redisKey = getPathsCacheKey();
    const cached = await readRedisJson<Awaited<ReturnType<typeof getPublishedTutorialPaths>>>(redisKey);
    if (cached !== null) {
      return cached;
    }

    const paths = await getPublishedTutorialPaths();
    await writeRedisJson(redisKey, paths, PUBLISHED_PATHS_TTL_SECONDS);
    return paths;
  },
  ['tutorial-delivery-paths'],
  { revalidate: 3600 }
);

export async function getPublishedTutorialPathsForDelivery() {
  return getPublishedTutorialPathsCached();
}

export async function getTutorialHierarchyForDelivery(params: {
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
}) {
  return getHierarchyBySlugsCached(
    params.domainSlug,
    params.subjectSlug,
    params.topicSlug,
    params.subtopicSlug
  );
}

export async function getTutorialSectionsForDelivery(
  subtopicSlug: string,
  difficulty: TutorialDifficulty = 'simple'
) {
  return getPublishedSectionsBySubtopicSlugCached(subtopicSlug, difficulty);
}

export async function getValidatedTutorialSectionsForDelivery(
  subtopicSlug: string,
  difficulty: TutorialDifficulty = 'simple'
): Promise<ValidatedTutorialSectionsPayload | null> {
  const payload = await getTutorialSectionsForDelivery(subtopicSlug, difficulty);
  if (payload === null) {
    return null;
  }

  const sections: Partial<Record<TutorialSectionId, unknown>> = {};
  const invalidSections: TutorialSectionError[] = [];

  for (const contract of TUTORIAL_SECTION_CONTRACTS) {
    const rawSection = payload.sections[contract.dbType];
    if (rawSection === undefined) {
      continue;
    }

    const validation = validateTutorialSection(contract.dbType, rawSection);
    if (!validation.success) {
      invalidSections.push({
        sectionType: contract.dbType,
        issues: validation.issues,
      });
      continue;
    }

    sections[contract.dbType] = validation.data;
  }

  return {
    subtopicId: payload.subtopicId,
    subtopicName: payload.subtopicName,
    difficulty: payload.difficulty,
    sectionMeta: payload.sectionMeta,
    sections,
    invalidSections,
  };
}

export function buildTutorialContentFromValidatedSections(
  sections: Partial<Record<TutorialSectionId, unknown>>
): TutorialContentJSON {
  return sections as TutorialContentJSON;
}

export function getSectionValidationErrorMessage(error: TutorialSectionError): string {
  return `This tutorial section failed schema validation and must be regenerated. Section: ${error.sectionType}. ${formatTutorialSectionValidationIssues(error.issues)}`;
}
