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

// Universal Navigation authoring schema - only structure, no presentation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authoringNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['group', 'page']),
  icon: z.string().optional(),
  expanded: z.boolean().optional(),
  children: z.array(authoringNodeSchema).optional(),
}).strict());

// Universal Navigation tree - contains only topics array
const authoringTreeSchema = z.object({
  topics: z.array(authoringNodeSchema).min(1),
}).strict();

// Normalized navigation node (after slug/URL generation)
type NormalizedNode = {
  id: string;
  name: string;
  type: 'group' | 'page';
  icon?: string;
  expanded?: boolean;
  slug: string;  // System-generated
  url?: string;  // System-generated (page nodes only)
  children?: NormalizedNode[];
};

type AuthoringTree = z.infer<typeof authoringTreeSchema>;
type NormalizedTree = { topics: NormalizedNode[] };

const saveSchema = z.object({
  brandId: z.enum(['realtutorialhub', 'skillup', 'shared']),
  domainId: z.string().uuid(),
  subjectId: z.string().uuid(),
  topicId: z.string().uuid(),
  activeSubtopicId: z.string().uuid().optional(),
  tree: authoringTreeSchema,
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

function validateNavigationDepth(nodes: TutorialNavigationTree['topics'], currentDepth = 1, path = 'Root'): void {
  if (currentDepth > 3) {
    throw new Error(`Navigation depth exceeds maximum of 3 levels at: ${path}. Move deeper content into tutorial page content.`);
  }
  
  nodes.forEach((node) => {
    if (node.children && node.children.length > 0) {
      validateNavigationDepth(node.children, currentDepth + 1, `${path} → ${node.name}`);
    }
  });
}

function validateNodeTypes(nodes: TutorialNavigationTree['topics'], path = 'Root'): void {
  nodes.forEach((node) => {
    if (!node.type || (node.type !== 'group' && node.type !== 'page')) {
      throw new Error(`Invalid or missing node type at: ${path} → ${node.name}. Must be 'group' or 'page'.`);
    }
    
    if (node.type === 'page' && node.children && node.children.length > 0) {
      throw new Error(`Page node cannot have children at: ${path} → ${node.name}. Pages are leaf nodes.`);
    }
    
    if (node.type === 'group' && (!node.children || node.children.length === 0)) {
      throw new Error(`Group node must have children at: ${path} → ${node.name}. Use type='page' for leaf nodes.`);
    }
    
    if (node.children && node.children.length > 0) {
      validateNodeTypes(node.children, `${path} → ${node.name}`);
    }
  });
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

// Transform authoring tree into normalized universal navigation structure
// Adds system-generated slug and URL, but NO brand/theme/progress/status
function normalizeTreeUrls(authoringTree: AuthoringTree, scope: { domainSlug: string; subjectSlug: string; topicSlug: string }): NormalizedTree {
  function normalizeNodes(nodes: AuthoringTree['topics']): NormalizedNode[] {
    return nodes.map((node) => {
      const canonicalSlug = compactSlug(node.name);
      const isPageNode = node.type === 'page';
      
      return {
        ...node,
        slug: canonicalSlug,
        url: isPageNode ? `/tutorial-v2/${scope.domainSlug}/${scope.subjectSlug}/${scope.topicSlug}/${canonicalSlug}` : undefined,
        children: node.children ? normalizeNodes(node.children) : node.children,
      };
    });
  }

  return {
    topics: normalizeNodes(authoringTree.topics),
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
    
    // Validate navigation structure
    try {
      validateNavigationDepth(body.tree.topics);
      validateNodeTypes(body.tree.topics);
    } catch (validationError) {
      return NextResponse.json({ 
        error: validationError instanceof Error ? validationError.message : 'Navigation validation failed.' 
      }, { status: 400 });
    }
    
    const now = new Date();
    const hierarchy = await getHierarchyNames(body.domainId, body.subjectId, body.topicId, body.activeSubtopicId ?? null);
    
    // Transform authoring tree to normalized navigation (slug + URL only, no brand/theme/progress/status)
    const normalizedTree = normalizeTreeUrls(body.tree, {
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
