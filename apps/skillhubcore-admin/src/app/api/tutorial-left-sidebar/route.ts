import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, sql } from 'drizzle-orm';

import {
  dbHttp,
  tutorialSidebarTreesV2,
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
  tutorialSubtopics,
} from '@quiz/db-tutorial';
import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';
import {
  normalizeNavigationIds,
  validateUniqueCanonicalNavigationIds,
} from '../../(admin)/tools/tutorial-left-sidebar/utils/navigation-id';
import { saveSchema, validateBrandId } from './sidebar-schema';
import { validateNavigationDepth, validateNodeTypes } from './navigation-validation';
import { transformNavigationTree } from './sidebar-transformer';
import { parseMarkdownNavigation } from './markdown-navigation-parser';

export const dynamic = 'force-dynamic';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactSlug(value: string | undefined) {
  return (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Ensure complete hierarchy synchronization for a topic before sidebar publish.
 * 
 * This guarantees that:
 * 1. Parent chain (domain → subject → topic) exists in TutorialDB
 * 2. ALL active subtopics under the topic exist in TutorialDB
 * 3. Every external_id mapping is verified
 * 
 * @throws Error if any required synchronization or verification fails
 */
async function ensureTopicHierarchySynced(topicId: string): Promise<{
  domain: { externalId: string; internalId: string };
  subject: { externalId: string; internalId: string };
  topic: { externalId: string; internalId: string };
  subtopics: Array<{ externalId: string; internalId: string; name: string }>;
}> {
  const db = getDb();
  const now = new Date();

  // Load MainDB topic with parent chain
  const topicRows = await db.select().from(shcTopics).where(eq(shcTopics.id, topicId));
  if (topicRows.length === 0) {
    throw new Error(`Topic not found: ${topicId}`);
  }
  const topic = topicRows[0];

  const subjectRows = await db.select().from(shcSubjects).where(eq(shcSubjects.id, topic.subjectId));
  if (subjectRows.length === 0) {
    throw new Error(`Subject not found for topic: ${topicId}`);
  }
  const subject = subjectRows[0];

  const domainRows = await db.select().from(shcDomains).where(eq(shcDomains.id, subject.domainId));
  if (domainRows.length === 0) {
    throw new Error(`Domain not found for topic: ${topicId}`);
  }
  const domain = domainRows[0];

  // Load ALL active subtopics for this topic
  const activeSubtopics = await db
    .select()
    .from(shcSubtopics)
    .where(and(
      eq(shcSubtopics.topicId, topicId),
      isNull(shcSubtopics.deletedAt)
    ));

  // Synchronize complete hierarchy in a transaction
  const result = await dbHttp.transaction(async (tx) => {
    // Helper to generate unique slug
    const uniqueSlug = (name: string, entityId: string) => {
      const slugified = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
      const suffix = entityId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
      return `${slugified}-${suffix.length > 0 ? suffix : entityId.slice(0, 8)}`;
    };

    // Sync domain
    const [tutorialDomain] = await tx
      .insert(tutorialDomains)
      .values({
        externalId: domain.id,
        name: domain.name,
        slug: uniqueSlug(domain.name, domain.id),
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialDomains.externalId,
        set: {
          name: domain.name,
          slug: uniqueSlug(domain.name, domain.id),
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialDomains.id });

    // Sync subject
    const [tutorialSubject] = await tx
      .insert(tutorialSubjects)
      .values({
        externalId: subject.id,
        domainId: tutorialDomain.id,
        name: subject.name,
        slug: uniqueSlug(subject.name, subject.id),
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialSubjects.externalId,
        set: {
          domainId: tutorialDomain.id,
          name: subject.name,
          slug: uniqueSlug(subject.name, subject.id),
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialSubjects.id });

    // Sync topic
    const [tutorialTopic] = await tx
      .insert(tutorialTopics)
      .values({
        externalId: topic.id,
        subjectId: tutorialSubject.id,
        name: topic.name,
        slug: uniqueSlug(topic.name, topic.id),
        deletedAt: null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: tutorialTopics.externalId,
        set: {
          subjectId: tutorialSubject.id,
          name: topic.name,
          slug: uniqueSlug(topic.name, topic.id),
          deletedAt: null,
          updatedAt: now,
        },
      })
      .returning({ id: tutorialTopics.id });

    // Sync ALL active subtopics
    const subtopicResults: Array<{ externalId: string; internalId: string; name: string }> = [];
    
    for (const subtopic of activeSubtopics) {
      const [tutorialSubtopic] = await tx
        .insert(tutorialSubtopics)
        .values({
          externalId: subtopic.id,
          topicId: tutorialTopic.id,
          name: subtopic.name,
          slug: uniqueSlug(subtopic.name, subtopic.id),
          difficultyLevels: [],
          deletedAt: null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: tutorialSubtopics.externalId,
          set: {
            topicId: tutorialTopic.id,
            name: subtopic.name,
            slug: uniqueSlug(subtopic.name, subtopic.id),
            difficultyLevels: [],
            deletedAt: null,
            updatedAt: now,
          },
        })
        .returning({ id: tutorialSubtopics.id });

      subtopicResults.push({
        externalId: subtopic.id,
        internalId: tutorialSubtopic.id,
        name: subtopic.name,
      });
    }

    return {
      domain: {
        externalId: domain.id,
        internalId: tutorialDomain.id,
      },
      subject: {
        externalId: subject.id,
        internalId: tutorialSubject.id,
      },
      topic: {
        externalId: topic.id,
        internalId: tutorialTopic.id,
      },
      subtopics: subtopicResults,
    };
  });

  // Verify all mappings exist
  const domainCheck = await dbHttp.select({ id: tutorialDomains.id })
    .from(tutorialDomains)
    .where(eq(tutorialDomains.externalId, result.domain.externalId))
    .limit(1);
  if (domainCheck.length === 0) {
    throw new Error(`Domain mapping verification failed: ${result.domain.externalId}`);
  }

  const subjectCheck = await dbHttp.select({ id: tutorialSubjects.id })
    .from(tutorialSubjects)
    .where(eq(tutorialSubjects.externalId, result.subject.externalId))
    .limit(1);
  if (subjectCheck.length === 0) {
    throw new Error(`Subject mapping verification failed: ${result.subject.externalId}`);
  }

  const topicCheck = await dbHttp.select({ id: tutorialTopics.id })
    .from(tutorialTopics)
    .where(eq(tutorialTopics.externalId, result.topic.externalId))
    .limit(1);
  if (topicCheck.length === 0) {
    throw new Error(`Topic mapping verification failed: ${result.topic.externalId}`);
  }

  for (const subtopic of result.subtopics) {
    const subtopicCheck = await dbHttp.select({ id: tutorialSubtopics.id })
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.externalId, subtopic.externalId))
      .limit(1);
    if (subtopicCheck.length === 0) {
      throw new Error(`Subtopic mapping verification failed: ${subtopic.externalId}`);
    }
  }

  return result;
}

/**
 * Get and validate hierarchy relationships
 * 
 * Validates that the provided IDs form an actual parent-child hierarchy:
 * Domain → Subject → Topic → (optional) Subtopic
 * 
 * @throws Error if hierarchy relationships are invalid
 */
async function getHierarchyNames(
  domainId: string, 
  subjectId: string, 
  topicId: string, 
  activeSubtopicId: string | null
) {
  const db = getDb();
  
  // Fetch all records
  const [domain] = await db.select().from(shcDomains).where(eq(shcDomains.id, domainId)).limit(1);
  const [subject] = await db.select().from(shcSubjects).where(eq(shcSubjects.id, subjectId)).limit(1);
  const [topic] = await db.select().from(shcTopics).where(eq(shcTopics.id, topicId)).limit(1);
  const [activeSubtopic] = activeSubtopicId
    ? await db.select().from(shcSubtopics).where(eq(shcSubtopics.id, activeSubtopicId)).limit(1)
    : [null];

  // Validate records exist
  if (!domain) {
    throw new Error(`Domain not found: ${domainId}`);
  }
  if (!subject) {
    throw new Error(`Subject not found: ${subjectId}`);
  }
  if (!topic) {
    throw new Error(`Topic not found: ${topicId}`);
  }
  if (activeSubtopicId && !activeSubtopic) {
    throw new Error(`Subtopic not found: ${activeSubtopicId}`);
  }

  // Validate parent-child relationships
  if (subject.domainId !== domain.id) {
    throw new Error(
      `Invalid hierarchy: Subject "${subject.name}" (${subject.id}) does not belong to Domain "${domain.name}" (${domain.id}). ` +
      `Subject's actual domainId: ${subject.domainId}`
    );
  }

  if (topic.subjectId !== subject.id) {
    throw new Error(
      `Invalid hierarchy: Topic "${topic.name}" (${topic.id}) does not belong to Subject "${subject.name}" (${subject.id}). ` +
      `Topic's actual subjectId: ${topic.subjectId}`
    );
  }

  if (activeSubtopic && activeSubtopic.topicId !== topic.id) {
    throw new Error(
      `Invalid hierarchy: Subtopic "${activeSubtopic.name}" (${activeSubtopic.id}) does not belong to Topic "${topic.name}" (${topic.id}). ` +
      `Subtopic's actual topicId: ${activeSubtopic.topicId}`
    );
  }

  return { domain, subject, topic, activeSubtopic };
}

async function responseFromRow(row: typeof tutorialSidebarTreesV2.$inferSelect) {
  const hierarchy = await getHierarchyNames(row.domainId, row.subjectId, row.topicId, row.activeSubtopicId);
  return {
    scope: {
      brandId: row.brandId,
      domainId: row.domainId,
      domainSlug: hierarchy.domain ? slugify(hierarchy.domain.name) : '',
      domainName: hierarchy.domain?.name ?? '',
      subjectId: row.subjectId,
      subjectSlug: hierarchy.subject ? slugify(hierarchy.subject.name) : '',
      subjectName: hierarchy.subject?.name ?? '',
      topicId: row.topicId,
      topicSlug: hierarchy.topic ? slugify(hierarchy.topic.name) : '',
      topicName: hierarchy.topic?.name ?? '',
      activeSubtopicId: row.activeSubtopicId ?? undefined,
      activeSubtopicSlug: hierarchy.activeSubtopic ? compactSlug(hierarchy.activeSubtopic.name) : undefined,
    },
    tree: row.tree,
    sourceFormat: row.sourceFormat,
    sourceContent: row.sourceContent,
    status: row.status,
    version: row.version,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt?.toISOString() ?? null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandIdParam = searchParams.get('brandId');
    const topicId = searchParams.get('topicId');

    // Runtime validation for brandId
    const brandId = validateBrandId(brandIdParam);

    if (!brandId || !topicId) {
      return NextResponse.json({ 
        error: 'Invalid or missing parameters. brandId must be one of: realtutorialhub, skillup, shared. topicId is required.' 
      }, { status: 400 });
    }

    const [row] = await dbHttp
      .select()
      .from(tutorialSidebarTreesV2)
      .where(and(
        eq(tutorialSidebarTreesV2.brandId, brandId),
        eq(tutorialSidebarTreesV2.topicId, topicId)
      ))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Sidebar tree not found.' }, { status: 404 });
    }

    return NextResponse.json(await responseFromRow(row));
  } catch (error) {
    console.error('[Tutorial Left Sidebar API] GET failed', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = saveSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid sidebar payload.', details: parsed.error.flatten() }, { status: 400 });
    }

    const body = parsed.data;
    const now = new Date();
    
    // Resolve and validate hierarchy relationships
    // This validates Domain → Subject → Topic → Subtopic parent-child relationships
    let hierarchy;
    try {
      hierarchy = await getHierarchyNames(
        body.domainId, 
        body.subjectId, 
        body.topicId, 
        body.activeSubtopicId ?? null
      );
    } catch (hierarchyError) {
      return NextResponse.json({ 
        error: hierarchyError instanceof Error ? hierarchyError.message : 'Invalid hierarchy relationships.' 
      }, { status: 400 });
    }
    
    // Parse input based on sourceFormat
    // Both JSON and Markdown converge to AuthoringNavigationNode[]
    let authoringTopics;
    try {
      if (body.sourceFormat === 'markdown') {
        authoringTopics = parseMarkdownNavigation(body.sourceContent);
      } else {
        // JSON: Parse tree.topics
        authoringTopics = body.tree.topics;
      }
    } catch (parseError) {
      return NextResponse.json({ 
        error: parseError instanceof Error ? parseError.message : 'Failed to parse navigation source.' 
      }, { status: 400 });
    }
    
    // Validate navigation structure (authoring input)
    try {
      validateNavigationDepth(authoringTopics);
      validateNodeTypes(authoringTopics);
      // Validate ID uniqueness on authoring nodes before normalization
      validateUniqueCanonicalNavigationIds(authoringTopics);
    } catch (validationError) {
      return NextResponse.json({ 
        error: validationError instanceof Error ? validationError.message : 'Navigation structure validation failed.' 
      }, { status: 400 });
    }
    
    // Phase 0: Normalize IDs
    // AuthoringNavigationNode[] → TutorialNavigationNode[]
    const canonicalTree = {
      topics: normalizeNavigationIds(authoringTopics)
    };
    
    // Transform: Add slug/URL
    // TutorialNavigationNode[] → NormalizedNode[]
    const normalizedTree = transformNavigationTree(
      canonicalTree,
      {
        domainSlug: slugify(hierarchy.domain.name),
        subjectSlug: slugify(hierarchy.subject.name),
        topicSlug: slugify(hierarchy.topic.name),
      }
    );

    // CRITICAL: Ensure TutorialDB hierarchy foundation before publishing
    let hierarchySyncResult: Awaited<ReturnType<typeof ensureTopicHierarchySynced>> | undefined;
    if (body.status === 'published') {
      try {
        hierarchySyncResult = await ensureTopicHierarchySynced(body.topicId);
        console.log('[Tutorial Left Sidebar API] Hierarchy synchronized before publish:', {
          topic: body.topicId,
          subtopicsCount: hierarchySyncResult.subtopics.length,
        });
      } catch (syncError) {
        console.error('[Tutorial Left Sidebar API] Hierarchy sync failed, preventing publish:', syncError);
        return NextResponse.json({
          error: 'Tutorial hierarchy synchronization failed. Sidebar was not published.',
          details: syncError instanceof Error ? syncError.message : 'Unknown sync error',
        }, { status: 500 });
      }
    }
    
    // Persist to database
    const values = {
      brandId: body.brandId,
      domainId: body.domainId,
      subjectId: body.subjectId,
      topicId: body.topicId,
      activeSubtopicId: body.activeSubtopicId ?? null,
      tree: normalizedTree,
      sourceFormat: body.sourceFormat,
      sourceContent: body.sourceContent,
      status: body.status,
      publishedAt: body.status === 'published' ? now : null,
      updatedAt: now,
    };

    const [saved] = await dbHttp
      .insert(tutorialSidebarTreesV2)
      .values(values)
      .onConflictDoUpdate({
        target: [
          tutorialSidebarTreesV2.brandId,
          tutorialSidebarTreesV2.topicId,
        ],
        set: {
          ...values,
          version: sql`${tutorialSidebarTreesV2.version} + 1`,
        },
      })
      .returning();

    const sidebar = await responseFromRow(saved);
    const deliveryPath = sidebar.scope.activeSubtopicSlug
      ? `/tutorial-v2/${sidebar.scope.domainSlug}/${sidebar.scope.subjectSlug}/${sidebar.scope.topicSlug}/${sidebar.scope.activeSubtopicSlug}`
      : null;

    return NextResponse.json({
      success: true,
      message: body.status === 'published' ? 'Sidebar published and saved.' : 'Sidebar draft saved.',
      sidebar,
      deliveryUrls: {
        realtutorialhub: deliveryPath,
        skillup: deliveryPath,
      },
      ...(hierarchySyncResult && {
        hierarchySync: {
          domain: 'synced',
          subject: 'synced',
          topic: 'synced',
          subtopics: {
            total: hierarchySyncResult.subtopics.length,
            synced: hierarchySyncResult.subtopics.length,
          },
        },
      }),
    });
  } catch (error) {
    console.error('[Tutorial Left Sidebar API] POST failed', error);
    
    // Enhanced diagnostic logging for PostgreSQL errors
    /* eslint-disable @typescript-eslint/no-explicit-any */
    if (error && typeof error === 'object') {
      console.error('[Tutorial Left Sidebar API] Error details:', {
        message: (error as any).message,
        code: (error as any).code,
        detail: (error as any).detail,
        constraint: (error as any).constraint,
        table: (error as any).table,
        column: (error as any).column,
        cause: (error as any).cause,
        causeMessage: (error as any).cause?.message,
        causeCode: (error as any).cause?.code,
        causeDetail: (error as any).cause?.detail,
        stack: (error as any).stack,
      });
    }
    
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error',
      // Include diagnostic info in development
      ...(process.env.NODE_ENV === 'development' && error && typeof error === 'object' ? {
        details: {
          code: (error as any).code,
          detail: (error as any).detail,
          constraint: (error as any).constraint,
        }
      } : {})
    /* eslint-enable @typescript-eslint/no-explicit-any */
    }, { status: 500 });
  }
}
