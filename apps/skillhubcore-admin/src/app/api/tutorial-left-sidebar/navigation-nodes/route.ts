/**
 * Tutorial Navigation Nodes API
 * Phase 1: Returns navigation nodes for Composer navigation-node selector
 * 
 * GET /api/tutorial-left-sidebar/navigation-nodes?subtopicId=X&brandId=Y
 */

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, desc } from 'drizzle-orm';
import { db as mainDb, subtopics } from '@quiz/db';
import { db as tutorialDb, tutorialSidebarTreesV2 } from '@quiz/db-tutorial';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tutorial-left-sidebar/navigation-nodes
 * Returns navigation nodes for a given subtopic
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const subtopicId = searchParams.get('subtopicId');
    const brandId = searchParams.get('brandId') || 'shared';

    if (!subtopicId) {
      return NextResponse.json(
        { error: 'subtopicId is required' },
        { status: 400 }
      );
    }

    // Step 1: Get main database hierarchy (topicId from subtopicId)
    // subtopicId parameter is the authoritative main/quiz database ID
    const [mainSubtopic] = await mainDb
      .select({ 
        id: subtopics.id,
        topicId: subtopics.topicId 
      })
      .from(subtopics)
      .where(eq(subtopics.id, subtopicId))
      .limit(1);

    if (!mainSubtopic) {
      return NextResponse.json({ nodes: [] });
    }

    // Step 2: Fetch sidebar tree using MAIN database IDs
    // CRITICAL: tutorial_sidebar_trees_v2 uses main/quiz topic_id and subtopic_id
    // NOT tutorial-local IDs from tutorial_subtopics
    const [row] = await tutorialDb
      .select()
      .from(tutorialSidebarTreesV2)
      .where(and(
        eq(tutorialSidebarTreesV2.topicId, mainSubtopic.topicId),
        eq(tutorialSidebarTreesV2.activeSubtopicId, mainSubtopic.id),
        eq(tutorialSidebarTreesV2.brandId, brandId as 'shared' | 'skillup' | 'realtutorialhub')
      ))
      .orderBy(desc(tutorialSidebarTreesV2.version)) // Get latest version first
      .limit(1);

    console.log('[Navigation Nodes API] Query result:', {
      foundRow: !!row,
      hasTree: !!row?.tree,
      mainTopicId: mainSubtopic.topicId,
      mainSubtopicId: mainSubtopic.id,
      brandId
    });

    if (!row || !row.tree) {
      console.log('[Navigation Nodes API] No tree found for query');
      return NextResponse.json({ nodes: [] });
    }

    // Step 3: Extract navigation page nodes from sidebar tree
    const tree = row.tree as { topics?: Array<{ id: string; name: string; type: string; slug: string; children?: unknown[] }> };
    console.log('[Navigation Nodes API] Tree topics:', tree.topics?.length || 0);
    const nodes = extractNavigationNodes(tree.topics || []);
    console.log('[Navigation Nodes API] Extracted nodes:', nodes.length);

    return NextResponse.json({ nodes });
  } catch (error) {
    console.error('[Navigation Nodes API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load navigation nodes' },
      { status: 500 }
    );
  }
}

/**
 * Recursively extract navigation page nodes from sidebar tree
 * Returns flat list of page nodes only (excludes groups)
 * 
 * Phase 1: navigationNodeId is the page node's id from the sidebar tree
 */
function extractNavigationNodes(nodes: Array<{ id: string; name: string; type: string; slug?: string; children?: unknown[] }>): Array<{
  id: string;
  name: string;
  type: string;
  slug: string;
}> {
  const result: Array<{
    id: string;
    name: string;
    type: string;
    slug: string;
  }> = [];

  for (const node of nodes) {
    // Only include page-type nodes (not groups)
    if (node.type === 'page') {
      result.push({
        id: node.id,
        name: node.name,
        type: node.type,
        slug: node.slug || '',
      });
    }

    // Recursively traverse children
    if (node.children && Array.isArray(node.children)) {
      result.push(...extractNavigationNodes(node.children));
    }
  }

  return result;
}
