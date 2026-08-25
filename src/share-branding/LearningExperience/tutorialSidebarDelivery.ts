import { and, eq, isNull } from 'drizzle-orm';

import {
  dbHttp,
  tutorialSidebarTreesV2,
  tutorialDeliveryService,
} from '@quiz/db-tutorial';
import {
  domains as shcDomains,
  getDb,
  subjects as shcSubjects,
  subtopics as shcSubtopics,
  topics as shcTopics,
} from '@quiz/db';
import type {
  BrandTutorialTheme,
  TutorialNavigationNode,
  TutorialNavigationTree,
  TutorialNormalizedNavigationNode,
  TutorialNormalizedNavigationTree,
  TutorialPagePayload,
  TutorialSidebarBrandId,
} from '@quiz/types';

export interface TutorialSidebarDeliveryParams {
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>;
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  navigationNodeId: string; // Phase 1: Exact sidebar node.id
}

export interface TutorialSidebarDeliveryPayload {
  tree: TutorialNavigationTree;
  activeUrl: string;
  hierarchy: {
    domain: { id: string; name: string; slug: string };
    subject: { id: string; name: string; slug: string };
    topic: { id: string; name: string; slug: string };
    subtopic: { id: string; name: string; slug: string };
  };
}

interface FlatNavigationItem {
  id: string; // Phase 1: Exact sidebar node.id
  name: string;
  slug: string;
  url: string;
}

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

function matchesSlug(value: string, slug: string) {
  return slugify(value) === slug || compactSlug(value) === compactSlug(slug);
}

function canonicalSubtopicSlug(value: string | undefined) {
  return compactSlug(value);
}

function getRuntimeBrandConfig(brandId: Exclude<TutorialSidebarBrandId, 'shared'>): Pick<TutorialNavigationTree, 'brand' | 'theme'> {
  if (brandId === 'skillup') {
    return {
      brand: {
        name: 'SkillUp IT Academy',
        shortName: 'SUIA',
        tagline: 'Build Skills That Move Careers',
      },
      theme: {
        primary: '#f54a8d',
        primaryDark: '#d63d7a',
        secondary: '#133382',
        activeBackground: '#fff0f6',
        completed: '#08a64a',
      },
    };
  }

  return {
    brand: {
      name: 'RealTutorialHub',
      shortName: 'RTH',
      tagline: 'Learn Smarter, Not Harder',
    },
    theme: {
      primary: '#d03f00',
      primaryDark: '#b63600',
      secondary: '#124fd6',
      activeBackground: '#eef3fa',
      completed: '#08a64a',
    },
  };
}

// Transform normalized tree (from DB) into complete runtime tree with brand/theme/subject/progress
function withRuntimeBrand(
  normalizedTree: TutorialNormalizedNavigationTree, 
  brandId: Exclude<TutorialSidebarBrandId, 'shared'>,
  subjectName: string
): TutorialNavigationTree {
  const runtimeBrand = getRuntimeBrandConfig(brandId);

  // Convert normalized nodes to runtime nodes (copy all fields as-is)
  function toRuntimeNodes(nodes: TutorialNormalizedNavigationNode[]): TutorialNavigationNode[] {
    return nodes.map((node) => ({
      ...node,
      children: node.children ? toRuntimeNodes(node.children) : undefined,
    }));
  }

  return {
    brand: runtimeBrand.brand,
    theme: runtimeBrand.theme satisfies BrandTutorialTheme,
    subject: {
      name: subjectName,
    },
    progress: {
      percentage: 0, // TODO: Calculate from tutorial_progress table
    },
    topics: toRuntimeNodes(normalizedTree.topics),
  };
}

function flattenNavigation(nodes: TutorialNavigationNode[]): FlatNavigationItem[] {
  const items: FlatNavigationItem[] = [];

  function walk(branch: TutorialNavigationNode[]) {
    for (const node of branch) {
      // Only include nodes with both url and slug (pages with generated URLs)
      if (node.url && node.slug) {
        items.push({ 
          id: node.id, // Phase 1: Preserve exact node.id
          name: node.name, 
          slug: node.slug, 
          url: node.url 
        });
      }
      if (node.children) {
        walk(node.children);
      }
    }
  }

  walk(nodes);
  return items;
}

function withTutorialV2Url(item: FlatNavigationItem, hierarchy: TutorialSidebarDeliveryPayload['hierarchy']): FlatNavigationItem {
  // Phase 1: Include exact navigationNodeId in URL
  return {
    ...item,
    url: `/tutorial-v2/${hierarchy.domain.slug}/${hierarchy.subject.slug}/${hierarchy.topic.slug}/${canonicalSubtopicSlug(item.slug || item.name)}/${item.id}`,
  };
}

function isActiveNavigationItem(item: FlatNavigationItem, params: TutorialSidebarDeliveryParams) {
  // Phase 1: ONLY match by exact navigationNodeId - no subtopic-based fallback
  return item.id === params.navigationNodeId;
}

async function resolveHierarchy(params: TutorialSidebarDeliveryParams) {
  console.log('[DELIVERY_TRACE] resolveHierarchy START', { domainSlug: params.domainSlug, subjectSlug: params.subjectSlug, topicSlug: params.topicSlug, subtopicSlug: params.subtopicSlug });
  
  const db = getDb();
  
  // Log which database URL is being used
  console.log('[DELIVERY_TRACE] Database connection', { 
    DATABASE_URL: process.env.DATABASE_URL?.substring(0, 50) + '...',
    DATABASE_URL_TUTORIAL: process.env.DATABASE_URL_TUTORIAL?.substring(0, 50) + '...'
  });
  
  const domainRows = await db
    .select()
    .from(shcDomains)
    .where(isNull(shcDomains.deletedAt));
  const domain = domainRows.find((row) => matchesSlug(row.name, params.domainSlug));

  console.log('[DELIVERY_TRACE] Domain resolution', { found: !!domain, domainName: domain?.name });

  if (!domain) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - domain not found');
    return null;
  }

  const subjectRows = await db
    .select()
    .from(shcSubjects)
    .where(and(
      eq(shcSubjects.domainId, domain.id),
      isNull(shcSubjects.deletedAt)
    ));
  const subject = subjectRows.find((row) => matchesSlug(row.name, params.subjectSlug));

  console.log('[DELIVERY_TRACE] Subject resolution', { found: !!subject, subjectName: subject?.name, subjectId: subject?.id });

  if (!subject) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - subject not found');
    return null;
  }

  const topicRows = await db
    .select()
    .from(shcTopics)
    .where(and(
      eq(shcTopics.subjectId, subject.id),
      isNull(shcTopics.deletedAt)
    ));
  
  console.log('[DELIVERY_TRACE] Topic query', { subjectId: subject.id, query: `SELECT * FROM topics WHERE subject_id='${subject.id}' AND deleted_at IS NULL` });
  console.log('[DELIVERY_TRACE] Topic query result', { count: topicRows.length, topicNames: topicRows.map(r => r.name), targetSlug: params.topicSlug });
  
  const topic = topicRows.find((row) => {
    const matches = matchesSlug(row.name, params.topicSlug);
    console.log('[DELIVERY_TRACE] Topic match check', { topicName: row.name, targetSlug: params.topicSlug, slugified: slugify(row.name), matches });
    return matches;
  });

  console.log('[DELIVERY_TRACE] Topic resolution', { found: !!topic, topicName: topic?.name, topicId: topic?.id });

  if (!topic) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - topic not found');
    return null;
  }

  const subtopicRows = await db
    .select()
    .from(shcSubtopics)
    .where(and(
      eq(shcSubtopics.topicId, topic.id),
      isNull(shcSubtopics.deletedAt)
    ));
  const subtopic = subtopicRows.find((row) => matchesSlug(row.name, params.subtopicSlug));

  console.log('[DELIVERY_TRACE] Subtopic resolution', { found: !!subtopic, subtopicName: subtopic?.name, subtopicId: subtopic?.id });

  if (!subtopic) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - subtopic not found');
    return null;
  }

  console.log('[DELIVERY_TRACE] resolveHierarchy SUCCESS');
  return {
    domain: { id: domain.id, name: domain.name, slug: slugify(domain.name) },
    subject: { id: subject.id, name: subject.name, slug: slugify(subject.name) },
    topic: { id: topic.id, name: topic.name, slug: slugify(topic.name) },
    subtopic: { id: subtopic.id, name: subtopic.name, slug: canonicalSubtopicSlug(subtopic.name) },
  };
}

export async function getPublishedTutorialSidebar(params: TutorialSidebarDeliveryParams): Promise<TutorialSidebarDeliveryPayload | null> {
  console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar START', params);
  
  const hierarchy = await resolveHierarchy(params);
  if (!hierarchy) {
    console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar FAIL - hierarchy null');
    return null;
  }

  console.log('[DELIVERY_TRACE] Querying sidebar with topicId:', hierarchy.topic.id);

  const sharedRows = await dbHttp
    .select()
    .from(tutorialSidebarTreesV2)
    .where(and(
      eq(tutorialSidebarTreesV2.brandId, 'shared'),
      eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.id),
      eq(tutorialSidebarTreesV2.status, 'published')
    ))
    .limit(1);

  console.log('[DELIVERY_TRACE] Shared sidebar query result:', { count: sharedRows.length });

  const brandRows = sharedRows.length > 0
    ? []
    : await dbHttp
      .select()
      .from(tutorialSidebarTreesV2)
      .where(and(
        eq(tutorialSidebarTreesV2.brandId, params.brandId),
        eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.id),
        eq(tutorialSidebarTreesV2.status, 'published')
      ))
      .limit(1);

  const sidebar = sharedRows[0] ?? brandRows[0];
  if (!sidebar) {
    console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar FAIL - no sidebar found');
    return null;
  }

  console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar SUCCESS');

  // Transform normalized tree (from DB) into complete runtime tree
  const brandedTree = withRuntimeBrand(sidebar.tree, params.brandId, hierarchy.subject.name);

  // Phase 1: activeUrl is resolved by exact navigationNodeId in getPublishedTutorialPagePayload
  // This function provides only the tree and hierarchy
  return {
    tree: brandedTree,
    activeUrl: '', // Placeholder - actual activeUrl resolved by caller with exact navigationNodeId
    hierarchy,
  };
}

export async function getPublishedTutorialPagePayload(params: TutorialSidebarDeliveryParams): Promise<TutorialPagePayload | null> {
  console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload START', params);
  
  const sidebarPayload = await getPublishedTutorialSidebar(params);
  if (!sidebarPayload) {
    console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload FAIL - sidebar payload null');
    return null;
  }

  const { hierarchy, tree } = sidebarPayload;

  console.log('[DELIVERY_TRACE] Validating navigationNodeId:', params.navigationNodeId);

  // Phase 1: Validate navigationNodeId exists in sidebar and is a page node
  const validateNavigationNode = (nodes: TutorialNavigationNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === params.navigationNodeId) {
        // Found the node - verify it's a page (has url and slug)
        const isValid = !!(node.url && node.slug);
        console.log('[DELIVERY_TRACE] Found navigationNode', { id: node.id, hasUrl: !!node.url, hasSlug: !!node.slug, isValid });
        return isValid;
      }
      if (node.children) {
        if (validateNavigationNode(node.children)) {
          return true;
        }
      }
    }
    return false;
  };

  if (!validateNavigationNode(tree.topics)) {
    // navigationNodeId not found or not a page node
    console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload FAIL - navigation node validation failed');
    return null;
  }

  // Phase 1: Resolve activeUrl by exact navigationNodeId
  const findUrlByNavigationNodeId = (nodes: TutorialNavigationNode[], nodeId: string): string => {
    for (const node of nodes) {
      if (node.id === nodeId && node.url) {
        return node.url;
      }
      if (node.children) {
        const childUrl = findUrlByNavigationNodeId(node.children, nodeId);
        if (childUrl) {
          return childUrl;
        }
      }
    }
    return '';
  };

  const activeUrl = findUrlByNavigationNodeId(tree.topics, params.navigationNodeId);

  console.log('[DELIVERY_TRACE] Active URL resolved:', activeUrl);

  // Phase 1: Fail closed if navigationNodeId validation passed but URL not found
  if (!activeUrl) {
    console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload FAIL - activeUrl empty');
    return null;
  }

  // Phase 1: Use getTutorialByPage with exact navigationNodeId
  console.log('[DELIVERY_TRACE] Calling getTutorialByPage', { subtopicSlug: hierarchy.subtopic.slug, navigationNodeId: params.navigationNodeId, brandId: params.brandId });
  
  const deliveryResult = await tutorialDeliveryService.getTutorialByPage(
    hierarchy.subtopic.id,
    params.navigationNodeId,
    {
      brandId: params.brandId,
      includeUnpublished: false,
    }
  );

  console.log('[DELIVERY_TRACE] getTutorialByPage result:', { hasTutorial: !!deliveryResult.tutorial });

  const tutorial = deliveryResult.tutorial;
  
  /*
   * PHASE 11.11D FIX: Decouple sidebar from content
   * 
   * Sidebar + navigation must render even when tutorial content is:
   * - Not yet created (0/18 blocks)
   * - Invalid/failing schema validation
   * - Missing from database
   * 
   * This enables progressive rendering and matches documented behavior:
   * "Create page node → publish sidebar → do NOT create content → 
   * learner navigates → TutorialPageShell shows 'Content not published yet' → 
   * Left Sidebar still visible"
   * 
   * Content absence/failure should only affect content region, not page shell.
   */
  if (!tutorial) {
    console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload - tutorial is null, continuing with empty content');
  } else {
    console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload - tutorial content available');
  }
  
  console.log('[DELIVERY_TRACE] getPublishedTutorialPagePayload SUCCESS');

  // V2 Architecture: Preserve TutorialDocument.blocks[] through delivery
  // Do NOT convert back to legacy definition/code/summary structure
  // Allow empty blocks array when tutorial is unavailable
  const content: TutorialPagePayload['content'] = {
    blocks: tutorial?.content?.blocks ?? [],
  };

  const flatItems = flattenNavigation(tree.topics).map((item) => withTutorialV2Url(item, hierarchy));
  const activeIndex = flatItems.findIndex((item) => isActiveNavigationItem(item, params));

  return {
    brandId: params.brandId,
    theme: tree.theme,
    sidebar: tree,
    activeUrl,
    hierarchy: {
      domain: hierarchy.domain,
      subject: hierarchy.subject,
      topic: hierarchy.topic,
      subtopic: hierarchy.subtopic,
    },
    content,
    footer: {
      previous: activeIndex > 0 ? flatItems[activeIndex - 1] : null,
      next: activeIndex >= 0 && activeIndex < flatItems.length - 1 ? flatItems[activeIndex + 1] : null,
    },
  };
}
