/**
 * Tutorial Hydration Hook
 * Phase 2: Enhanced with request-sequence race protection
 * 
 * Responsibility: Fetch and hydrate tutorial document blocks based on selected navigation context
 * 
 * PHASE 2 RACE PROTECTION:
 * - AbortController for transport-level cancellation
 * - Request sequence counter for stale-response protection
 * - Both mechanisms work independently to ensure safety
 */

import { useCallback, useRef, useState } from 'react';
import type {
  TutorialSidebarBrandId,
  TutorialDocument,
} from '@quiz/types';

import {
  tutorialBlocksToInstances,
  type BlockInstance,
} from '../document/documentTransformation';

interface UseTutorialHydrationParams {
  brandId: TutorialSidebarBrandId;
}

interface UseTutorialHydrationResult {
  documentBlocks: BlockInstance[];
  setDocumentBlocks: React.Dispatch<
    React.SetStateAction<BlockInstance[]>
  >;
  isLoadingDocument: boolean;
  loadedSectionId: string | null;
  setLoadedSectionId: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  hasUnsavedLocalChangesRef: React.MutableRefObject<boolean>;
  loadExistingTutorial: (
    subtopicId: string,
    navigationNodeId: string,
  ) => Promise<void>;
  invalidateHydration: () => void;
  setMessage: (message: string) => void;
  message: string;
}

/**
 * Hook for managing tutorial document hydration
 * 
 * Phase 1: Extended to support navigationNodeId for page-specific queries
 * Phase 2: Added request-sequence protection against stale responses
 * 
 * @param params - Configuration including brandId
 * @returns Hydration state and operations
 */
export function useTutorialHydration({
  brandId,
}: UseTutorialHydrationParams): UseTutorialHydrationResult {
  const [documentBlocks, setDocumentBlocks] =
    useState<BlockInstance[]>([]);

  const [isLoadingDocument, setIsLoadingDocument] =
    useState(false);

  const [loadedSectionId, setLoadedSectionId] =
    useState<string | null>(null);

  const [message, setMessage] = useState('');

  /**
   * Existing Composer protection.
   *
   * Hydration must never overwrite locally modified content.
   */
  const hasUnsavedLocalChangesRef =
    useRef(false);

  /**
   * ------------------------------------------------------------
   * PHASE 2 — REQUEST SEQUENCE
   * ------------------------------------------------------------
   *
   * This is the authoritative stale-response protection.
   *
   * Every new hydration request increments this value.
   *
   * Only the request owning the current sequence may mutate state.
   */
  const hydrationSequenceRef =
    useRef(0);

  /**
   * ------------------------------------------------------------
   * PHASE 2 — ACTIVE REQUEST
   * ------------------------------------------------------------
   *
   * Used for transport-level cancellation.
   *
   * IMPORTANT:
   * AbortController is NOT the stale-response guarantee.
   *
   * The sequence check remains authoritative.
   */
  const activeControllerRef =
    useRef<AbortController | null>(null);

  /**
   * ------------------------------------------------------------
   * INVALIDATE HYDRATION
   * ------------------------------------------------------------
   *
   * Used when:
   *
   * - navigationNodeId becomes empty
   * - subtopic changes
   * - hierarchy changes
   *
   * This invalidates every previously started request.
   */
  const invalidateHydration = useCallback(() => {
    /**
     * Invalidate all previous requests FIRST.
     */
    hydrationSequenceRef.current += 1;

    /**
     * Then attempt transport cancellation.
     */
    activeControllerRef.current?.abort();
    activeControllerRef.current = null;

    /**
     * Remove stale document state immediately.
     */
    setDocumentBlocks([]);
    setLoadedSectionId(null);
    setIsLoadingDocument(false);
  }, []);

  /**
   * ------------------------------------------------------------
   * LOAD EXISTING TUTORIAL
   * ------------------------------------------------------------
   * 
   * Phase 1: Requires (subtopicId, navigationNodeId, brandId) for precise section lookup
   * Phase 2: Protected against race conditions via request sequence
   * 
   * Identity: (subtopicId, navigationNodeId, brandId) → specific tutorial section
   */
  const loadExistingTutorial = useCallback(
    async (
      subtopicId: string,
      navigationNodeId: string,
    ): Promise<void> => {
      /**
       * Defensive validation.
       *
       * The Composer already prevents this call when either
       * value is empty, but this hook must remain safe itself.
       */
      if (!subtopicId || !navigationNodeId) {
        invalidateHydration();
        return;
      }

      /**
       * --------------------------------------------------------
       * START NEW REQUEST
       * --------------------------------------------------------
       */
      const requestSequence =
        ++hydrationSequenceRef.current;

      /**
       * Cancel previous transport request.
       *
       * Even if abort fails/races, sequence protection below
       * prevents the stale response from mutating state.
       */
      activeControllerRef.current?.abort();

      const controller =
        new AbortController();

      activeControllerRef.current =
        controller;

      /**
       * New navigation context means old document content
       * must not remain visible while loading.
       */
      setDocumentBlocks([]);
      setLoadedSectionId(null);
      setIsLoadingDocument(true);
      setMessage('');

      try {
        const queryParams =
          new URLSearchParams({
            subtopicId,
            navigationNodeId,
            brandId,
            limit: '1',
          });

        const response = await fetch(
          `/api/tutorial-composer/sections?${queryParams.toString()}`,
          {
            method: 'GET',
            signal: controller.signal,
            cache: 'no-store',
          },
        );

        /**
         * ------------------------------------------------------
         * STALE RESPONSE GUARD #1
         * ------------------------------------------------------
         */
        if (
          requestSequence !==
          hydrationSequenceRef.current
        ) {
          return;
        }

        /**
         * Aborted requests must never hydrate.
         */
        if (controller.signal.aborted) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            'Failed to load existing tutorial',
          );
        }

        const result =
          await response.json();

        /**
         * ------------------------------------------------------
         * STALE RESPONSE GUARD #2
         * ------------------------------------------------------
         *
         * The request may have become stale while the response
         * was being parsed.
         */
        if (
          requestSequence !==
          hydrationSequenceRef.current
        ) {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        /**
         * Existing unsaved-change protection remains authoritative.
         */
        if (
          hasUnsavedLocalChangesRef.current
        ) {
          setMessage(
            'Cannot load: You have unsaved local changes. Save or discard changes first.',
          );
          return;
        }

        const section =
          result.data?.[0];

        if (!section) {
          setDocumentBlocks([]);
          setLoadedSectionId(null);
          setMessage(
            'No existing tutorial found for this navigation node. Ready to create a new document.',
          );
          return;
        }

        const document =
          section.content as
            | TutorialDocument
            | undefined;

        if (
          !document ||
          !Array.isArray(document.blocks)
        ) {
          setDocumentBlocks([]);
          setLoadedSectionId(section.id);
          setMessage(
            'Existing tutorial has no valid document blocks. Ready for editing.',
          );
          return;
        }

        /**
         * Transformation may itself take time.
         */
        const instances =
          tutorialBlocksToInstances(
            document.blocks,
          );

        /**
         * ------------------------------------------------------
         * STALE RESPONSE GUARD #3
         * ------------------------------------------------------
         *
         * Final guard immediately before state mutation.
         */
        if (
          requestSequence !==
          hydrationSequenceRef.current
        ) {
          return;
        }

        if (controller.signal.aborted) {
          return;
        }

        /**
         * ------------------------------------------------------
         * ACCEPT CURRENT REQUEST
         * ------------------------------------------------------
         */
        setDocumentBlocks(instances);
        setLoadedSectionId(section.id);

        setMessage(
          `Loaded ${instances.length} block(s) from existing tutorial.`,
        );
      } catch (error) {
        /**
         * Aborted/stale requests are silent.
         */
        if (
          controller.signal.aborted ||
          requestSequence !==
            hydrationSequenceRef.current
        ) {
          return;
        }

        setDocumentBlocks([]);
        setLoadedSectionId(null);

        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to load tutorial',
        );
      } finally {
        /**
         * ONLY the current request may change loading state.
         */
        if (
          requestSequence ===
            hydrationSequenceRef.current &&
          !controller.signal.aborted
        ) {
          setIsLoadingDocument(false);
        }

        /**
         * Never clear another request's controller.
         */
        if (
          activeControllerRef.current ===
          controller
        ) {
          activeControllerRef.current = null;
        }
      }
    },
    [
      brandId,
      invalidateHydration,
    ],
  );

  return {
    documentBlocks,
    setDocumentBlocks,
    isLoadingDocument,
    loadedSectionId,
    setLoadedSectionId,
    hasUnsavedLocalChangesRef,
    loadExistingTutorial,
    invalidateHydration,
    setMessage,
    message,
  };
}
