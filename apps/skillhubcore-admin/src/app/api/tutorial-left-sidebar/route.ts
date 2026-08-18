import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

import {
  dbHttp,
  tutorialSidebarTreesV2,
} from '@quiz/db-tutorial';
import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';
import type { TutorialNavigationTree, TutorialSidebarBrandId } from '@quiz/types';

export const dynamic = 'force-dynamic';

const nodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().optional(),
  status: z.enum(['completed', 'in-progress', 'not-started']),
  expanded: z.boolean().optional(),
  url: z.string().optional(),
  children: z.array(nodeSchema).optional(),
}));

const treeSchema = z.object({
  brand: z.object({
    name: z.string().min(1),
    shortName: z.string().min(1),
    tagline: z.string().min(1),
    logoUrl: z.string().optional(),
  }),
  theme: z.object({
    primary: z.string().min(1),
    primaryDark: z.string().min(1),
    secondary: z.string().min(1),
    activeBackground: z.string().min(1),
    completed: z.string().min(1),
  }),
  subject: z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
  }),
  progress: z.object({
    percentage: z.number().min(0).max(100),
  }),
  topics: z.array(nodeSchema).min(1),
});

const saveSchema = z.object({
  brandId: z.enum(['realtutorialhub', 'skillup', 'shared']),
  domainId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  activeSubtopicId: z.string().uuid().optional(),
  tree: treeSchema,
  sourceFormat: z.enum(['json', 'markdown']),
  sourceContent: z.string().min(1),
  status: z.enum(['draft', 'published']),
});

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

async function getHierarchyNames(domainId: string, subjectId: string, topicId: string, activeSubtopicId: string | null) {
  const db = getDb();
  const [domain] = await db.select().from(shcDomains).where(eq(shcDomains.id, domainId)).limit(1);
  const [subject] = await db.select().from(shcSubjects).where(eq(shcSubjects.id, subjectId)).limit(1);
  const [topic] = await db.select().from(shcTopics).where(eq(shcTopics.id, topicId)).limit(1);
  const [activeSubtopic] = activeSubtopicId
    ? await db.select().from(shcSubtopics).where(eq(shcSubtopics.id, activeSubtopicId)).limit(1)
    : [null];

  return { domain, subject, topic, activeSubtopic };
}

function normalizeTreeUrls(tree: TutorialNavigationTree, scope: { domainSlug: string; subjectSlug: string; topicSlug: string }): TutorialNavigationTree {
  function normalizeNodes(nodes: TutorialNavigationTree['topics']): TutorialNavigationTree['topics'] {
    return nodes.map((node) => {
      const canonicalSlug = compactSlug(node.slug || node.name);
      return {
        ...node,
        slug: canonicalSlug || node.slug,
        url: node.url ? `/tutorial-v2/${scope.domainSlug}/${scope.subjectSlug}/${scope.topicSlug}/${canonicalSlug || node.slug}` : node.url,
        children: node.children ? normalizeNodes(node.children) : node.children,
      };
    });
  }

  return {
    ...tree,
    topics: normalizeNodes(tree.topics),
  };
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
    const brandId = searchParams.get('brandId') as TutorialSidebarBrandId | null;
    const topicId = searchParams.get('topicId');

    if (!brandId || !topicId) {
      return NextResponse.json({ error: 'brandId and topicId are required.' }, { status: 400 });
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
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
    const hierarchy = await getHierarchyNames(body.domainId, body.subjectId, body.topicId, body.activeSubtopicId ?? null);
    const normalizedTree = normalizeTreeUrls(body.tree as TutorialNavigationTree, {
      domainSlug: hierarchy.domain ? slugify(hierarchy.domain.name) : '',
      subjectSlug: hierarchy.subject ? slugify(hierarchy.subject.name) : '',
      topicSlug: hierarchy.topic ? slugify(hierarchy.topic.name) : '',
    });
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
    });
  } catch (error) {
    console.error('[Tutorial Left Sidebar API] POST failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
