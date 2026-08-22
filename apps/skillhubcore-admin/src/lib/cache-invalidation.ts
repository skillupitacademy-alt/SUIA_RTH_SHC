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
 * Get subtopic slug from internal or external UUID
 * 
 * @param subtopicId - Internal tutorialSubtopics.id OR external_id from MainDB
 * @returns Subtopic slug or null if not found
 */
async function getSubtopicSlug(subtopicId: string): Promise<string | null> {
  try {
    // Try internal ID first
    let result = await db
      .select({ slug: tutorialSubtopics.slug })
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.id, subtopicId))
      .limit(1);

    // If not found, try external ID
    if (!result[0]) {
      result = await db
        .select({ slug: tutorialSubtopics.slug })
        .from(tutorialSubtopics)
        .where(eq(tutorialSubtopics.externalId, subtopicId))
        .limit(1);
    }

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
 * @param subtopicId - The subtopic ID (can be internal tutorial_subtopics.id OR external MainDB UUID)
 * 
 * @example
 * ```ts
 * // With external MainDB UUID
 * await invalidateTutorialDeliveryCache('12efacf1-b5ad-4b43-9fe4-17ba1cf249e4');
 * 
 * // With internal tutorial_subtopics.id
 * await invalidateTutorialDeliveryCache('ba9125f3-12b1-4698-9262-2da3116073a7');
 * ```
 */
export async function invalidateTutorialDeliveryCache(
  subtopicId: string
): Promise<void> {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!baseUrl || !token) {
    console.warn(
      '[Cache Invalidation] Upstash Redis not configured - cache invalidation skipped',
      {
        hasBaseUrl: !!baseUrl,
        hasToken: !!token,
        subtopicId,
      }
    );
    return;
  }

  // Fetch slug from database (handles both internal and external IDs)
  const subtopicSlug = await getSubtopicSlug(subtopicId);
  if (!subtopicSlug) {
    console.error('[Cache Invalidation] Subtopic not found', {
      subtopicId,
    });
    return;
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
    subtopicId,
    subtopicSlug,
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
    subtopicId,
    subtopicSlug,
  });
}

/**
 * Batch invalidate tutorial delivery caches for multiple subtopics
 * 
 * Useful when bulk operations affect multiple subtopics.
 * 
 * @param subtopicIds - Array of subtopic IDs (internal or external)
 */
export async function invalidateTutorialDeliveryCacheBatch(
  subtopicIds: string[]
): Promise<void> {
  await Promise.all(
    subtopicIds.map((id) => invalidateTutorialDeliveryCache(id))
  );
}
