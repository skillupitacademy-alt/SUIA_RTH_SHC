/**
 * TutorialRuntimeContext
 *
 * Universal learner-side runtime context for Tutorial V2 pages.
 *
 * IMPORTANT DISTINCTIONS:
 * - This is RUNTIME context (learner-facing), not AI generation context
 * - This is SEPARATE from TutorialPromptContext (authoring/AI-side)
 * - This contains identities needed by the page orchestration layer
 *
 * IDENTITY SEPARATION:
 * - navigationNodeId: WHERE the learner is (sidebar node, URL identity)
 * - subtopicId: curriculum hierarchy identity
 * - sectionId: tutorial_sections row identity (optional - may not exist yet)
 * - blockId: content block instance identity
 * - learnerId: WHO is learning
 * - sessionId: WHICH learning session (tab-scoped, separate from auth session)
 *
 * These identities MUST remain separate and MUST NOT be conflated.
 */

export interface TutorialRuntimeContext {
  // Learner identity
  learnerId: string;

  // Curriculum hierarchy
  hierarchy: {
    domainId: string;
    domainName: string;
    domainSlug: string;

    subjectId: string;
    subjectName: string;
    subjectSlug: string;

    topicId: string;
    topicName: string;
    topicSlug: string;

    subtopicId: string;
    subtopicName: string;
    subtopicSlug: string;
  };

  // Navigation identity (Phase 1: exact sidebar node.id)
  navigationNodeId: string;
  navigationNodeName: string;

  // Tutorial section identity (may be null if content not created yet)
  sectionId: string | null;

  // Brand context
  brandId: 'realtutorialhub' | 'skillup';

  /**
   * Tutorial Learning Session ID
   *
   * IMPORTANT: This is NOT the Auth Session.id.
   * This is a browser-tab-scoped UUID established by tutorialSessionService.
   *
   * - null:   during SSR (server rendering) — no sessionStorage available
   * - string: after client-side mount — one UUID per browser tab
   *
   * Semantics: one continuous learning context per browser tab.
   *   Survives: page reload, in-tab navigation (D1 → C1 → next page)
   *   Destroyed: on tab close, new tab, private window
   *
   * Carried as: x-session-id header in ILS API calls (Step 2+)
   * Never placed in: JSON bodies, JWT claims, auth cookies
   * Never derived from: learnerId, navigationNodeId, subtopicId, Auth Session.id
   */
  sessionId: string | null;
}

/**
 * TutorialBlockRuntimeContext
 *
 * Universal runtime boundary for block rendering.
 *
 * SEPARATION OF CONCERNS:
 * - Block CONTENT (schema/JSON) remains clean
 * - Block RUNTIME (tracking/progress) uses this context
 * - Blocks do NOT individually implement tracking logic
 *
 * This context is passed to the universal rendering layer,
 * NOT embedded in block content JSON.
 */
export interface TutorialBlockRuntimeContext {
  // Learner identity
  learnerId: string;

  // Page identity
  navigationNodeId: string;
  sectionId: string | null;

  // Block identity
  blockId: string;
  blockType: string;
  blockVersion: string;

  // Curriculum context (for tracking aggregation)
  subtopicId: string;
}

/**
 * TutorialTrackingEvent
 *
 * Universal learner activity tracking contract.
 *
 * IMPORTANT:
 * - This is NOT part of block content schemas
 * - This is NOT duplicated in D1/C1/S1/I1/O1/etc.
 * - This is handled by universal tracking service
 * - Block content failures MUST NOT prevent tracking attempts
 * - Tracking failures MUST NOT prevent content rendering
 */
export interface TutorialTrackingEvent {
  eventType: 'page_view' | 'block_view' | 'block_enter' | 'block_complete' | 'tutorial_complete';

  // Learner identity
  learnerId: string;

  // Page identity
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId?: string; // Required for persistence via /api/tutorial/progress

  // Optional block context (for block-level events)
  blockId?: string;
  blockType?: string;
  blockVersion?: string;

  // Optional metadata
  timeSpentMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * TutorialProgressState
 *
 * Learner progress state (separate from content).
 *
 * IMPORTANT SEPARATION:
 * - TutorialDocument.blocks[] = shared content (immutable per learner)
 * - TutorialProgressState = learner state (mutable, personal)
 *
 * Never mutate TutorialDocument because one learner completed a block.
 */
export interface TutorialProgressState {
  learnerId: string;
  subtopicId: string;

  // Block-level progress
  completedBlocks: string[]; // blockId[]

  // Page-level progress
  status: 'not_started' | 'in_progress' | 'completed';

  // Aggregated metrics
  completionPercent: number;
  timeSpentSec: number;

  // Timestamps
  startedAt: Date | null;
  completedAt: Date | null;
  lastViewedAt: Date;
}

/**
 * TutorialPageLoadingState
 *
 * Explicit loading/error states for learner page.
 *
 * IMPORTANT:
 * - Never render misleading blank page
 * - Distinguish: loading vs empty vs error
 * - Sidebar failure should not corrupt content (and vice versa)
 */
export type TutorialPageLoadingState =
  | { status: 'loading' }
  | { status: 'loaded'; hasContent: boolean }
  | { status: 'empty'; reason: 'no_sidebar' | 'no_navigation_node' | 'no_content' }
  | { status: 'error'; error: string };
