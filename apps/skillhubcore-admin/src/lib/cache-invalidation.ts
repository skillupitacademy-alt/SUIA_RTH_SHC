/**
 * Tutorial Cache Invalidation Utilities
 * 
 * Provides functions to invalidate Upstash Redis caches for tutorial content
 * when sections are created, updated, or published.
 * 
 * Used by both legacy ContentManager and new Tutorial Composer.
 */

import { db, tutorialSubtopics } from '@quiz/db-tutorial';
import { eq } from 'drizzle-orm';

const TUTORIAL_CACHE_VERSIONS = ['v1', 'v2'] as const;
const TUTORIAL_DIFFICULTIES = ['simple'] as const;

/**
 * Get subtopic slug from UUID
 * 
 * @param subtopicId - Subtopic UUID
 * @returns Subtopic slug or null if not found
 */
async function getSubtopicSlug(subtopicId: string): Promise<string | null> {
  try {
    const result = await db
      .select({ slug: tutorialSubtopics.slug })
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.id, subtopicId))
      .limit(1);

    return result[0]?.slug ?? null;
  } catch (error) {
    console.error('[Cache Invalidation] Failed to fetch subtopic slug', {
      subtopicId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Invalidate tutorial delivery caches for a specific subtopic
 * 
 * This clears Redis cache keys that store tutorial sections and navigation paths
 * for learner delivery. Called after content changes to ensure learners see
 * the latest published content.
 * 
 * @param subtopicSlugOrId - The subtopic slug (e.g., "javascript-variables") OR UUID
 * 
 * @example
 * ```ts
 * // With slug
 * await invalidateTutorialDeliveryCache('javascript-variables');
 * 
 * // With UUID (will be looked up)
 * await invalidateTutorialDeliveryCache('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
export async function invalidateTutorialDeliveryCache(
  subtopicSlugOrId: string
): Promise<void> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!baseUrl || !token) {
    console.warn(
      '[Cache Invalidation] Upstash Redis not configured - cache invalidation skipped',
      {
        hasBaseUrl: !!baseUrl,
        hasToken: !!token,
        subtopicSlugOrId,
      }
    );
    return;
  }

  // Determine if input is UUID or slug
  // UUID format: 8-4-4-4-12 hex digits
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    subtopicSlugOrId
  );

  let subtopicSlug: string;

  if (isUUID) {
    // Fetch slug from database
    const slug = await getSubtopicSlug(subtopicSlugOrId);
    if (!slug) {
      console.error('[Cache Invalidation] Subtopic not found', {
        subtopicId: subtopicSlugOrId,
      });
      return;
    }
    subtopicSlug = slug;
  } else {
    // Already a slug
    subtopicSlug = subtopicSlugOrId;
  }

  // Generate all cache keys that need to be invalidated
  const keys = TUTORIAL_CACHE_VERSIONS.flatMap((version) => [
    ...TUTORIAL_DIFFICULTIES.map(
      (difficulty) =>
        `tutorial:${version}:sections:${subtopicSlug}:${difficulty}`
    ),
    `tutorial:${version}:paths`,
  ]);

  console.log('[Cache Invalidation] Invalidating tutorial delivery cache', {
    subtopicSlugOrId,
    subtopicSlug,
    isUUID,
    keyCount: keys.length,
    keys,
  });

  // Delete all cache keys in parallel
  await Promise.all(
    keys.map(async (key) => {
      const url = `${baseUrl}/del/${encodeURIComponent(key)}`;
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });
      } catch (error) {
        console.warn('[Cache Invalidation] Failed to delete cache key', {
          key,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    })
  );

  console.log('[Cache Invalidation] Tutorial delivery cache invalidated', {
    subtopicSlugOrId,
    subtopicSlug,
  });
}

/**
 * Batch invalidate tutorial delivery caches for multiple subtopics
 * 
 * Useful when bulk operations affect multiple subtopics.
 * 
 * @param subtopicSlugsOrIds - Array of subtopic slugs or UUIDs
 */
export async function invalidateTutorialDeliveryCacheBatch(
  subtopicSlugsOrIds: string[]
): Promise<void> {
  await Promise.all(
    subtopicSlugsOrIds.map((slugOrId) => invalidateTutorialDeliveryCache(slugOrId))
  );
}
