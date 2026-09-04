'use client';

import { useState, useEffect, useRef } from 'react';

import type { TutorialPagePayload } from '@quiz/types';
import type { TutorialRuntimeContext } from '../runtime/TutorialRuntimeContext';
import { TutorialBlockRenderer, ActiveBlockProvider } from '@quiz/ui';
import { TutorialCodeContent } from './TutorialCodeContent';
import { TutorialDefinitionContent } from './TutorialDefinitionContent';
import { TutorialSummaryContent } from './TutorialSummaryContent';
import { TutorialLeftSidebar } from './TutorialLeftSidebar';
import { TutorialFooterNavigation, TutorialHeader } from './TutorialPageChrome';
import { trackTutorialEvent } from '../runtime/tutorialTrackingService';
import { getOrCreateTutorialLearningSessionId } from '../runtime/tutorialSessionService';

interface TutorialPageShellProps {
  payload: TutorialPagePayload;
  runtimeContext: TutorialRuntimeContext;
}

export function TutorialPageShell({ payload, runtimeContext }: TutorialPageShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [completedUrls, setCompletedUrls] = useState<Set<string> | undefined>(undefined);

  // Phase 3C-A: Ref to canonical tutorial block container for ActiveBlockProvider
  const contentContainerRef = useRef<HTMLDivElement>(null);

  /**
   * ILS Step 1: Tutorial Learning Session initialization.
   *
   * ONE authoritative initialization path — this is the SINGLE place where
   * the learning sessionId is established for this browser tab.
   *
   * SEQUENCING:
   *   TutorialPageShell mounts (client-side only)
   *       ↓
   *   getOrCreateTutorialLearningSessionId()
   *       ↓
   *   sessionStorage["tutorialLearningSessionId"]
   *       ↓
   *   available for telemetry consumers (visit, active-time — future phases)
   *
   * WHY useEffect:
   * - This is a Client Component ('use client')
   * - sessionStorage is unavailable during SSR
   * - useEffect only runs after hydration (browser context guaranteed)
   * - useRef prevents React Strict Mode from creating duplicate sessions
   *
   * WHAT THIS IS NOT:
   * - This is NOT the Auth Session.id
   * - This is NOT derived from learnerId, navigationNodeId, or subtopicId
   * - This does NOT modify any authentication state
   */
  const sessionInitializedRef = useRef(false);

  useEffect(() => {
    // Guard: only initialize once per component lifetime (Strict Mode safe)
    if (sessionInitializedRef.current) return;
    sessionInitializedRef.current = true;

    const sessionId = getOrCreateTutorialLearningSessionId();

    if (sessionId) {
      console.log('[Tutorial Session] Learning session established:', {
        sessionId,
        navigationNodeId: runtimeContext.navigationNodeId,
        // NEVER log: learnerId, auth cookies, tokens
      });
    }
    // sessionId is now available in sessionStorage["tutorialLearningSessionId"]
    // Future phases (Step 2: VisitEvent) will read it via readTutorialLearningSessionId()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: run exactly once on mount

  // Phase 2.5: Fetch learner progress and compute completed URLs
  useEffect(() => {
    async function loadProgress() {
      try {
        const { getTutorialProgress } = await import('../runtime/tutorialTrackingService');
        const progress = await getTutorialProgress(
          runtimeContext.learnerId,
          runtimeContext.hierarchy.subtopicId
        );

        if (!progress) {
          setCompletedUrls(new Set());
          return;
        }

        // Map completed blocks to navigation URLs
        // Currently blocks are tracked by blockType (e.g. 'definition', 'code', 'summary')
        // **ARCHITECTURAL BLOCKER:**
        // Current backend only persists (userId, subtopicId, blockType[])
        // Missing: navigationNodeId, sectionId, blockId, blockVersion
        //
        // Cannot map blockType to navigationNodeId (different identity domains)
        // Cannot use array-based completion check - identity violation
        //
        // BLOCKED: Sidebar navigation-node progress requires backend migration
        // See: .analysis/phase-25-runtime-completion-report.md
        //
        // For now: Mark nothing as complete until backend migration
        const completedSet = new Set<string>();

        // TODO (future backend phase): Replace with real navigation-node progress
        // Requires: GET /api/tutorial/progress?navigationNodeId=...
        // Returns: { navigationNodeId, completedBlockIds[], sectionProgress }

        setCompletedUrls(completedSet);
      } catch (error) {
        console.error('[Tutorial Progress] Failed to load progress:', error);
        setCompletedUrls(new Set());
      }
    }

    void loadProgress();
  }, [runtimeContext.learnerId, runtimeContext.hierarchy.subtopicId, payload.sidebar.topics]);

  // Phase 2.5: Track page view event (async, non-blocking)
  useEffect(() => {
    // Fire-and-forget tracking (failure-isolated)
    void trackTutorialEvent({
      eventType: 'page_view',
      learnerId: runtimeContext.learnerId,
      navigationNodeId: runtimeContext.navigationNodeId,
      sectionId: runtimeContext.sectionId,
      subtopicId: runtimeContext.hierarchy.subtopicId, // Required for persistence
    });
  }, [runtimeContext.learnerId, runtimeContext.navigationNodeId, runtimeContext.sectionId, runtimeContext.hierarchy.subtopicId]);

  // V2 Architecture: Render blocks[] when available
  const hasBlocks = payload.content.blocks && payload.content.blocks.length > 0;

  // Legacy fallback: Check for old content structure
  const hasLegacyContent =
    payload.content.definition ||
    payload.content.code ||
    payload.content.summary;

  // Phase 2.5: Prepare block runtime context for universal rendering
  // This provides tracking/identity boundary without modifying block content schemas
  const createBlockRuntimeContext = (blockId: string, blockType: string, blockVersion: string): import('../runtime/TutorialRuntimeContext').TutorialBlockRuntimeContext => ({
    learnerId: runtimeContext.learnerId,
    navigationNodeId: runtimeContext.navigationNodeId,
    sectionId: runtimeContext.sectionId,
    blockId,
    blockType,
    blockVersion,
    subtopicId: runtimeContext.hierarchy.subtopicId,
  });

  return (
    <main className="min-h-screen bg-white">
      <TutorialHeader
        crumbs={[payload.hierarchy.domain.name, payload.hierarchy.subject.name, payload.hierarchy.topic.name]}
        active={payload.hierarchy.subtopic.name}
        brand={payload.sidebar.brand}
        theme={payload.theme}
        onMenuClick={() => setIsSidebarOpen((current) => !current)}
      />
      <div className="flex w-full min-w-0 gap-0 bg-white">
        {isSidebarOpen && (
          <TutorialLeftSidebar
            tree={payload.sidebar}
            activeUrl={payload.activeUrl}
            // Phase 2.5: Pass actual completed URLs from learner progress
            completedUrls={completedUrls}
            // Phase 2.5: onNavigate can be used for client-side tracking
            onNavigate={(url, node) => {
              // Navigation handled by Next.js Link/router
              // Track navigation intent if needed
              console.log('[Tutorial Navigation]', { url, nodeId: node.id, nodeName: node.name });
            }}
          />
        )}
        <ActiveBlockProvider containerRef={contentContainerRef}>
          <div className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 bg-white">
            <div ref={contentContainerRef} className="w-full space-y-6">
              {hasBlocks ? (
                // V2 Canonical Path: Render blocks[] using TutorialBlockRenderer
                payload.content.blocks.map((block) => {
                  // Phase 2.5: Construct block runtime context for each block
                  // Type-safe version extraction without unsafe cast
                  const blockVersion = ('version' in block && typeof block.version === 'string')
                    ? block.version
                    : 'unversioned';
                  const blockRuntimeContext = createBlockRuntimeContext(
                    block.id,
                    block.type,
                    blockVersion
                  );

                  return (
                    <TutorialBlockRenderer
                      key={block.id}
                      block={block}
                      theme={payload.theme}
                      depth={0}
                      runtimeContext={blockRuntimeContext}
                    />
                  );
                })
              ) : hasLegacyContent ? (
                // Temporary Legacy Fallback: Render old content structure
                <>
                  {payload.content.definition && <TutorialDefinitionContent payload={payload.content.definition} theme={payload.theme} />}
                  {payload.content.code && <TutorialCodeContent payload={payload.content.code} theme={payload.theme} />}
                  {payload.content.summary && <TutorialSummaryContent payload={payload.content.summary} theme={payload.theme} />}
                </>
              ) : (
                // Empty/Unpublished State
                <section className="rounded-xl border border-[#e4eaf2] bg-white p-6 text-[#071f63] shadow-sm">
                  Content is not published for this subtopic yet.
                </section>
              )}
            </div>
            <TutorialFooterNavigation previous={payload.footer.previous} next={payload.footer.next} theme={payload.theme} />
          </div>
        </ActiveBlockProvider>
      </div>
    </main>
  );
}
