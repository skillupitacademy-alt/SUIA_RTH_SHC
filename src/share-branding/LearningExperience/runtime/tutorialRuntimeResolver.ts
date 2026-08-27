/**
 * Tutorial Runtime Resolver
 * 
 * Resolves URL parameters and sidebar tree into TutorialRuntimeContext.
 * 
 * ARCHITECTURE:
 * - Reuses existing getPublishedTutorialPagePayload() for hierarchy resolution
 * - Reuses existing sidebar tree navigation validation
 * - Adds learnerId from authentication headers
 * - Produces TutorialRuntimeContext for page orchestration
 * 
 * IDENTITY FLOW:
 *   URL params
 *       ↓
 *   resolveHierarchy() → domain/subject/topic/subtopic IDs
 *       ↓
 *   validateNavigationNode() → navigationNodeId validation
 *       ↓
 *   getTutorialByPage() → sectionId (may be null)
 *       ↓
 *   TutorialRuntimeContext
 */

import type { TutorialRuntimeContext } from './TutorialRuntimeContext';
import type { TutorialPagePayload } from '@quiz/types';

export interface ResolveRuntimeContextParams {
  // URL params (from Next.js route)
  domainSlug: string;
  subjectSlug: string;
  topicSlug: string;
  subtopicSlug: string;
  navigationNodeId: string;

  // Brand context
  brandId: 'realtutorialhub' | 'skillup';

  // Learner identity (from authentication)
  learnerId: string;
}

export type ResolveRuntimeContextResult =
  | {
      success: true;
      context: TutorialRuntimeContext;
      payload: TutorialPagePayload;
    }
  | {
      success: false;
      reason: 'hierarchy_not_found' | 'navigation_node_invalid' | 'sidebar_not_found';
    };

/**
 * Resolve runtime context from URL parameters
 * 
 * IMPORTANT:
 * - This wraps existing getPublishedTutorialPagePayload()
 * - Adds learnerId to produce complete TutorialRuntimeContext
 * - Returns full payload for backward compatibility
 * 
 * FAILURE MODES:
 * - Returns {success: false} if hierarchy cannot be resolved
 * - Returns {success: false} if navigationNodeId invalid
 * - Returns {success: false} if sidebar not found
 * - Does NOT throw exceptions
 */
export async function resolveRuntimeContext(
  params: ResolveRuntimeContextParams
): Promise<ResolveRuntimeContextResult> {
  try {
    // Reuse existing delivery service
    const { getPublishedTutorialPagePayload } = await import('../tutorialSidebarDelivery');

    const payload = await getPublishedTutorialPagePayload({
      brandId: params.brandId,
      domainSlug: params.domainSlug,
      subjectSlug: params.subjectSlug,
      topicSlug: params.topicSlug,
      subtopicSlug: params.subtopicSlug,
      navigationNodeId: params.navigationNodeId,
    });

    if (!payload) {
      // Could be: hierarchy not found, navigation node invalid, or sidebar not found
      // The existing service doesn't distinguish these - we'll use generic reason
      return {
        success: false,
        reason: 'hierarchy_not_found',
      };
    }

    // Extract sectionId from content metadata (if available)
    // Phase 1: sectionId may be null if content not created yet
    const sectionId = extractSectionId(payload);

    // Find navigation node name from sidebar tree
    const navigationNodeName = findNavigationNodeName(
      payload.sidebar.topics,
      params.navigationNodeId
    ) ?? 'Unknown';

    // Construct TutorialRuntimeContext
    const context: TutorialRuntimeContext = {
      learnerId: params.learnerId,
      hierarchy: {
        domainId: payload.hierarchy.domain.id,
        domainName: payload.hierarchy.domain.name,
        domainSlug: payload.hierarchy.domain.slug,

        subjectId: payload.hierarchy.subject.id,
        subjectName: payload.hierarchy.subject.name,
        subjectSlug: payload.hierarchy.subject.slug,

        topicId: payload.hierarchy.topic.id,
        topicName: payload.hierarchy.topic.name,
        topicSlug: payload.hierarchy.topic.slug,

        subtopicId: payload.hierarchy.subtopic.id,
        subtopicName: payload.hierarchy.subtopic.name,
        subtopicSlug: payload.hierarchy.subtopic.slug,
      },
      navigationNodeId: params.navigationNodeId,
      navigationNodeName,
      sectionId,
      brandId: params.brandId,
    };

    return {
      success: true,
      context,
      payload,
    };

  } catch (error) {
    console.error('[Tutorial Runtime] Failed to resolve context:', error);
    return {
      success: false,
      reason: 'hierarchy_not_found',
    };
  }
}

/**
 * Extract sectionId from payload content metadata
 * 
 * IMPORTANT:
 * - Returns null if content not created yet (valid state)
 * - Returns null if blocks array is empty (valid state)
 * - sectionId is tutorial_sections row identity
 */
function extractSectionId(payload: TutorialPagePayload): string | null {
  // Phase 2.5: Extract sectionId from content metadata
  // The delivery service includes sectionId in payload.content
  // Empty content is valid (returns null), not an error
  return payload.content.sectionId;
}

/**
 * Find navigation node name from sidebar tree
 * 
 * IMPORTANT:
 * - Recursively searches tree for exact navigationNodeId match
 * - Returns node.name when found
 * - Returns null if not found (should not happen after validation)
 */
function findNavigationNodeName(
  nodes: Array<{ id: string; name: string; children?: Array<any> }>,
  navigationNodeId: string
): string | null {
  for (const node of nodes) {
    if (node.id === navigationNodeId) {
      return node.name;
    }
    if (node.children) {
      const childName = findNavigationNodeName(node.children, navigationNodeId);
      if (childName) {
        return childName;
      }
    }
  }
  return null;
}

/**
 * Extract learnerId from Next.js request headers
 * 
 * IMPORTANT:
 * - Assumes proxy.ts middleware already validated token
 * - Assumes middleware added x-user-id header
 * - Returns null if authentication missing (caller should redirect)
 */
export function extractLearnerIdFromHeaders(
  headers: Headers
): string | null {
  const userId = headers.get('x-user-id');

  if (userId !== null && userId.trim().length > 0) {
    return userId.trim();
  }

  const shadowUserId = headers.get('x-shadow-user-id');

  if (
    shadowUserId !== null &&
    shadowUserId.trim().length > 0
  ) {
    return shadowUserId.trim();
  }

  return null;
}
