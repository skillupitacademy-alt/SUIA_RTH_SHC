import { and, eq, isNull } from 'drizzle-orm';

import {
  dbHttp,
  getTutorialDb,
  tutorialSidebarTreesV2,
  tutorialDeliveryService,
  tutorialSubtopics,
  tutorialDomains,
  tutorialSubjects,
  tutorialTopics,
} from '@quiz/db-tutorial';
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
    topic: { 
      id: string;           // TutorialDB internal ID
      externalId: string;   // MainDB topics.id (cross-database identity)
      name: string; 
      slug: string; 
    };
    subtopic: {
      id: string;              // TutorialDB internal ID
      externalId: string;      // MainDB subtopics.id (cross-database identity)
      name: string;
      slug: string;
      // Phase 2.6: Expose tutorial identity for explicit resolution
      tutorialId?: string;
      canonicalSlug?: string;
    };
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
  // PHASE 2.6 FIX: Use canonical TutorialDB slug from hierarchy, NOT regenerated compact slug
  // hierarchy.subtopic.slug is now the authoritative what-is-java-12efacf1, not whatisjava
  return {
    ...item,
    url: `/tutorial-v2/${hierarchy.domain.slug}/${hierarchy.subject.slug}/${hierarchy.topic.slug}/${hierarchy.subtopic.slug}/${item.id}`,
  };
}

function isActiveNavigationItem(item: FlatNavigationItem, params: TutorialSidebarDeliveryParams) {
  // Phase 1: ONLY match by exact navigationNodeId - no subtopic-based fallback
  return item.id === params.navigationNodeId;
}

async function resolveHierarchy(params: TutorialSidebarDeliveryParams) {
  console.log('[DELIVERY_TRACE] resolveHierarchy START', { domainSlug: params.domainSlug, subjectSlug: params.subjectSlug, topicSlug: params.topicSlug, subtopicSlug: params.subtopicSlug });
  
  try {
    const tutorialDb = getTutorialDb();
    
    // Log which database URL is being used
    console.log('[DELIVERY_TRACE] Database connection', { 
      DATABASE_URL_TUTORIAL: process.env.DATABASE_URL_TUTORIAL?.substring(0, 50) + '...'
    });
    
    const domainRows = await tutorialDb
      .select()
      .from(tutorialDomains)
      .where(isNull(tutorialDomains.deletedAt));
  const domain = domainRows.find((row) => matchesSlug(row.name, params.domainSlug));

  console.log('[DELIVERY_TRACE] Domain resolution', { found: !!domain, domainName: domain?.name });

  if (!domain) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - domain not found');
    return null;
  }

  const subjectRows = await tutorialDb
    .select()
    .from(tutorialSubjects)
    .where(and(
      eq(tutorialSubjects.domainId, domain.id),
      isNull(tutorialSubjects.deletedAt)
    ));
  const subject = subjectRows.find((row) => matchesSlug(row.name, params.subjectSlug));

  console.log('[DELIVERY_TRACE] Subject resolution', { found: !!subject, subjectName: subject?.name, subjectId: subject?.id });

  if (!subject) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - subject not found');
    return null;
  }

  const topicRows = await tutorialDb
    .select()
    .from(tutorialTopics)
    .where(and(
      eq(tutorialTopics.subjectId, subject.id),
      isNull(tutorialTopics.deletedAt)
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

  // PHASE 2.5-F: Resolve subtopic via tutorial_subtopics.slug when curriculum match fails
  // The URL may contain tutorial_subtopics.slug (e.g., 'what-is-java-12efacf1') 
  // which includes the curriculum ID suffix and won't match curriculum subtopic names directly.
  const subtopicRows = await tutorialDb
    .select()
    .from(tutorialSubtopics)
    .where(and(
      eq(tutorialSubtopics.topicId, topic.id),
      isNull(tutorialSubtopics.deletedAt)
    ));
  let subtopic = subtopicRows.find((row) => matchesSlug(row.name, params.subtopicSlug));

  console.log('[DELIVERY_TRACE] Subtopic resolution (direct match)', { found: !!subtopic, subtopicName: subtopic?.name, subtopicId: subtopic?.id });

  // If subtopic not found by name, try tutorial_subtopics.slug
  // This handles URLs like /tutorial-v2/.../what-is-java-12efacf1/whatisjava
  let tutorialSubtopic: { id: string; externalId: string; name: string; slug: string } | null = null; // PHASE 3C-J: Hoist to broader scope for later use
  
  if (!subtopic) {
    console.log('[DELIVERY_TRACE] Subtopic not found by name, trying slug match');
    
    [tutorialSubtopic] = await tutorialDb
      .select({
        id: tutorialSubtopics.id,
        externalId: tutorialSubtopics.externalId,
        name: tutorialSubtopics.name,
        slug: tutorialSubtopics.slug,
      })
      .from(tutorialSubtopics)
      .where(and(
        eq(tutorialSubtopics.slug, params.subtopicSlug),
        isNull(tutorialSubtopics.deletedAt)
      ))
      .limit(1);

    if (tutorialSubtopic) {
      console.log('[DELIVERY_TRACE] Found tutorial_subtopics match', { 
        tutorialSlug: tutorialSubtopic.slug, 
        externalId: tutorialSubtopic.externalId 
      });
      
      // PHASE 3C-J FIX: Support Tutorial V2-only content (no curriculum backing)
      // Try to resolve to curriculum subtopic via external_id for curriculum-backed tutorials
      subtopic = subtopicRows.find((row) => row.id === tutorialSubtopic!.externalId);
      
      console.log('[DELIVERY_TRACE] Resolved to curriculum subtopic via external_id', { 
        found: !!subtopic, 
        subtopicName: subtopic?.name, 
        subtopicId: subtopic?.id 
      });
      
      // If no curriculum subtopic exists, use the tutorial subtopic directly
      // This supports Tutorial V2-only content that has no curriculum backing record
      if (!subtopic) {
        console.log('[DELIVERY_TRACE] No curriculum subtopic found, using tutorial subtopic directly (Tutorial V2-only content)');
        // Cast tutorialSubtopic to match subtopicRows type (they're from the same table)
        subtopic = tutorialSubtopic as typeof subtopicRows[number];
      }
    }
  }

  if (!subtopic) {
    console.log('[DELIVERY_TRACE] resolveHierarchy FAIL - subtopic not found');
    return null;
  }

  // PHASE 2.6: Now resolve the authoritative TutorialDB identity
  // This ensures we preserve the CANONICAL tutorial slug instead of regenerating it
  //
  // PHASE 3C-J: Handle both curriculum-backed and Tutorial V2-only content
  // IMPORTANT: After 519ca2de, subtopicRows queries TutorialDB tutorial_subtopics
  // So subtopic.id is ALWAYS TutorialDB internal ID, not curriculum ID
  let tutorialSubtopicRecord: { id: string; externalId: string; name: string; slug: string } | undefined;
  
  // Check if we already have a tutorial subtopic from the slug match (Tutorial V2-only path)
  if (tutorialSubtopic && tutorialSubtopic.id === subtopic.id) {
    // Tutorial V2-only content: we already have the tutorial subtopic
    tutorialSubtopicRecord = tutorialSubtopic;
    console.log('[PHASE_2_6] Using Tutorial V2-only subtopic (no curriculum backing)', {
      tutorialSubtopicId: tutorialSubtopicRecord.id,
      tutorialSubtopicSlug: tutorialSubtopicRecord.slug,
    });
  } else {
    // PHASE 3C-M FIX: subtopic is from tutorialSubtopics table (line 239)
    // So subtopic.id is already TutorialDB internal ID
    // We already have the complete record - just use it directly
    tutorialSubtopicRecord = {
      id: subtopic.id,
      externalId: (subtopic as any).externalId, // Type from tutorialSubtopics includes externalId
      name: subtopic.name,
      slug: (subtopic as any).slug,
    };

    console.log('[PHASE_2_6] Using direct match from tutorial_subtopics', {
      tutorialSubtopicId: tutorialSubtopicRecord.id,
      tutorialSubtopicSlug: tutorialSubtopicRecord.slug,
      tutorialExternalId: tutorialSubtopicRecord.externalId,
    });
  }

  console.log('[DELIVERY_TRACE] resolveHierarchy SUCCESS');
  console.log('[PHASE_3C_M] TOPIC_IDENTITY', {
    'topic.id (TutorialDB internal)': topic.id,
    'topic.externalId (MainDB)': topic.externalId,
  });
  console.log('[PHASE_3C_M] SUBTOPIC_IDENTITY', {
    'subtopic.id (TutorialDB internal)': subtopic.id,
    'subtopic.externalId (MainDB/cross-DB)': tutorialSubtopicRecord.externalId,
    'subtopic.slug': tutorialSubtopicRecord.slug,
  });
  
  return {
    domain: { id: domain.id, name: domain.name, slug: slugify(domain.name) },
    subject: { id: subject.id, name: subject.name, slug: slugify(subject.name) },
    topic: { 
      id: topic.id,                    // TutorialDB internal ID
      externalId: topic.externalId,    // MainDB topics.id
      name: topic.name, 
      slug: slugify(topic.name) 
    },
    subtopic: {
      id: subtopic.id,                      // TutorialDB internal ID
      externalId: tutorialSubtopicRecord.externalId,  // MainDB subtopics.id
      name: subtopic.name,
      // PHASE 2.6 FIX: Use canonical TutorialDB slug, NOT regenerated from curriculum name
      slug: tutorialSubtopicRecord.slug,
      // Phase 2.6: Expose tutorial ID for explicit identity resolution
      tutorialId: tutorialSubtopicRecord.id,
      canonicalSlug: tutorialSubtopicRecord.slug,
    },
  };
  } catch (error) {
    // PHASE 2.6: Database failure is NOT a 404 - it's an infrastructure failure
    console.error('[PHASE_2_6][DATABASE_FAILURE]', {
      stage: 'resolveHierarchy',
      error: error instanceof Error ? error.message : String(error),
    });
    // Re-throw to let error boundary handle it (don't convert DB outage to notFound)
    throw error;
  }
}

export async function getPublishedTutorialSidebar(params: TutorialSidebarDeliveryParams): Promise<TutorialSidebarDeliveryPayload | null> {
  console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar START', params);
  
  const hierarchy = await resolveHierarchy(params);
  if (!hierarchy) {
    console.log('[DELIVERY_TRACE] getPublishedTutorialSidebar FAIL - hierarchy null');
    return null;
  }

  console.log('[DELIVERY_TRACE] Querying sidebar with topicId (externalId):', hierarchy.topic.externalId);
  console.log('[PHASE_3C_M] SIDEBAR_LOOKUP_IDENTITY', {
    'Using hierarchy.topic.externalId': hierarchy.topic.externalId,
  });

  const sharedRows = await dbHttp
    .select()
    .from(tutorialSidebarTreesV2)
    .where(and(
      eq(tutorialSidebarTreesV2.brandId, 'shared'),
      eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.externalId),  // Use MainDB ID
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
        eq(tutorialSidebarTreesV2.topicId, hierarchy.topic.externalId),  // Use MainDB ID
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

  // Phase 1: Use getTutorialByPage with exact navigationNodeId
  console.log('[DELIVERY_TRACE] Calling getTutorialByPage', { 
    subtopicSlug: hierarchy.subtopic.slug, 
    navigationNodeId: params.navigationNodeId, 
    brandId: params.brandId 
  });
  console.log('[PHASE_3C_M] TUTORIAL_CONTENT_IDENTITY', {
    'getTutorialByPage identifier': hierarchy.subtopic.externalId,
    'identifier meaning': 'tutorial_subtopics.external_id (MainDB subtopics.id)',
    'subtopic.id (internal)': hierarchy.subtopic.id,
  });
  
  const deliveryResult = await tutorialDeliveryService.getTutorialByPage(
    hierarchy.subtopic.externalId,  // Use external_id (cross-database identity)
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
    // Phase 2.5: Include sectionId for runtime identity
    sectionId: tutorial?.id ?? null,
  };

  // PHASE 2.6: Generate URLs with canonical TutorialDB slug
  // This regenerates URLs using hierarchy.subtopic.slug instead of reading from tree
  const flatItems = flattenNavigation(tree.topics).map((item) => withTutorialV2Url(item, hierarchy));
  const activeIndex = flatItems.findIndex((item) => isActiveNavigationItem(item, params));

  // PHASE 2.6: Use regenerated canonical URL, not tree's pre-stored URL
  const activeUrl = activeIndex >= 0 ? flatItems[activeIndex]!.url : '';

  console.log('[PHASE_2_6] Active URL uses canonical slug:', activeUrl);

  // Fail if navigationNodeId was validated but URL regeneration failed
  if (!activeUrl) {
    console.log('[PHASE_2_6] FAIL - activeUrl empty after regeneration');
    return null;
  }

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
