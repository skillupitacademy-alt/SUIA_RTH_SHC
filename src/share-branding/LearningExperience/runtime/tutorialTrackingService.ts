/**
 * Universal Tutorial Tracking Service
 * 
 * ARCHITECTURAL PRINCIPLE:
 * - Tracking is a UNIVERSAL capability
 * - Blocks (D1/C1/S1/I1/O1/etc.) do NOT implement tracking individually
 * - Future blocks automatically inherit tracking support
 * 
 * FAILURE ISOLATION:
 * - Tracking failure MUST NOT prevent content rendering
 * - Content failure MUST NOT prevent tracking attempts
 * - Log errors but continue execution
 * 
 * REUSE EXISTING INFRASTRUCTURE:
 * - This wraps existing tutorial_progress table
 * - This wraps existing tutorialProgressEngine
 * - This wraps existing /api/tutorial/progress endpoints
 * - Do NOT create competing tracking systems
 */

import type {
  TutorialTrackingEvent,
  TutorialProgressState,
} from './TutorialRuntimeContext';

/**
 * Map D1/C1/S1 block types to backend-compatible types
 * 
 * TEMPORARY PHASE 2.5 BRIDGE:
 * - D1/C1/S1 use: definition, code, summary
 * - Backend expects: technical, code, summary
 * - This mapping preserves both architectures during transition
 * 
 * Phase 2.6: Backend will support block-level identity (blockId, blockVersion)
 * and this mapping can be removed.
 */
function mapBlockTypeForBackend(blockType: string): string {
  const mapping: Record<string, string> = {
    'definition': 'technical', // D1 → technical section type
    'code': 'code',           // C1 → code section type
    'summary': 'summary',     // S1 → summary section type
  };
  
  return mapping[blockType] || blockType;
}

/**
 * Track a learner activity event
 * 
 * IMPORTANT:
 * - This is async but failures are swallowed (logged only)
 * - Caller should not await or check result
 * - Use fire-and-forget pattern to avoid blocking UI
 */
export async function trackTutorialEvent(
  event: TutorialTrackingEvent
): Promise<void> {
  try {
    // Only track block_complete events via API
    // page_view events are logged but not persisted (future enhancement)
    if (event.eventType !== 'block_complete') {
      console.log('[Tutorial Tracking] Event (not persisted):', {
        eventType: event.eventType,
        learnerId: event.learnerId,
        navigationNodeId: event.navigationNodeId,
      });
      return;
    }

    // Validate required fields for persistence
    if (!event.blockType || !event.subtopicId) {
      console.warn('[Tutorial Tracking] Missing required fields for block_complete:', {
        blockType: event.blockType,
        subtopicId: event.subtopicId,
      });
      return;
    }

    // Map D1/C1/S1 types to backend-compatible types
    const backendBlockType = mapBlockTypeForBackend(event.blockType);

    // Call existing /api/tutorial/progress POST endpoint
    // API expects: { subtopicId, blockType, status: 'viewed' }
    const response = await fetch('/api/tutorial/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Use cookies for authentication
      body: JSON.stringify({
        subtopicId: event.subtopicId,
        blockType: backendBlockType,
        status: 'viewed',
      }),
    });

    if (!response.ok) {
      console.warn(`[Tutorial Tracking] Progress API POST returned ${response.status}`);
      return;
    }

    console.log('[Tutorial Tracking] Block complete tracked:', {
      learnerId: event.learnerId,
      subtopicId: event.subtopicId,
      blockType: event.blockType,
      backendBlockType,
    });

  } catch (error) {
    // CRITICAL: Do not throw - tracking failure must not break content
    console.error('[Tutorial Tracking] Failed to track event:', error);
    // Explicitly do not rethrow
  }
}

/**
 * Get learner progress for current page
 * 
 * IMPORTANT:
 * - Returns null if progress not found (not an error)
 * - Returns null if API fails (logs error, continues)
 * - Caller must handle null gracefully
 */
export async function getTutorialProgress(
  learnerId: string,
  subtopicId: string
): Promise<TutorialProgressState | null> {
  try {
    // Call existing /api/tutorial/progress endpoint
    const response = await fetch(
      `/api/tutorial/progress?subtopicId=${encodeURIComponent(subtopicId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Use cookies for authentication
      }
    );

    if (!response.ok) {
      console.warn(`[Tutorial Tracking] Progress API returned ${response.status}`);
      return null;
    }

    const result = await response.json();
    
    // Transform API response to TutorialProgressState
    // API returns: { data: { blocksCompleted, completionPercent, assignmentUnlocked, progress } }
    const data = result.data;
    
    return {
      learnerId,
      subtopicId,
      completedBlocks: data.blocksCompleted || [],
      status: data.progress?.status || 'not_started',
      completionPercent: data.completionPercent || 0,
      timeSpentSec: 0, // Not yet tracked in current API
      startedAt: null, // Not yet tracked in current API
      completedAt: null, // Not yet tracked in current API
      lastViewedAt: new Date(),
    };

  } catch (error) {
    console.error('[Tutorial Tracking] Failed to get progress:', error);
    return null;
  }
}

/**
 * Mark block as completed
 * 
 * IMPORTANT:
 * - Idempotent (safe to call multiple times)
 * - Async but non-blocking (fire-and-forget)
 * - Failure is logged but does not throw
 */
export async function markBlockComplete(
  learnerId: string,
  subtopicId: string,
  navigationNodeId: string,
  sectionId: string | null,
  blockId: string,
  blockType: string,
  blockVersion: string
): Promise<void> {
  try {
    await trackTutorialEvent({
      eventType: 'block_complete',
      learnerId,
      navigationNodeId,
      sectionId,
      subtopicId,
      blockId,
      blockType,
      blockVersion,
    });
  } catch (error) {
    console.error('[Tutorial Tracking] Failed to mark block complete:', error);
  }
}

/**
 * Calculate page-level progress from block-level progress
 * 
 * IMPORTANT:
 * - Uses existing tutorialProgressEngine for mastery calculation
 * - Returns aggregated state, not individual block states
 */
export function calculatePageProgress(
  completedBlocks: string[],
  totalBlocks: number
): { status: 'not_started' | 'in_progress' | 'completed'; percent: number } {
  if (completedBlocks.length === 0) {
    return { status: 'not_started', percent: 0 };
  }
  
  const percent = Math.round((completedBlocks.length / totalBlocks) * 100);
  
  if (completedBlocks.length === totalBlocks) {
    return { status: 'completed', percent: 100 };
  }
  
  return { status: 'in_progress', percent };
}
