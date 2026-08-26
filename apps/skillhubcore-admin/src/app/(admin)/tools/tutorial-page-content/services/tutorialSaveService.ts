/**
 * Tutorial Save Service
 * Phase 1: Handles saving tutorial sections with navigationNodeId identity
 * 
 * Responsibility: Coordinate tutorial section CREATE/UPDATE operations
 */

import type {
  TutorialDocument,
  TutorialBlock,
  TutorialSidebarBrandId,
} from '@quiz/types';
import { toTutorialBlock, type BlockInstance } from '../document/documentTransformation';

export interface TutorialSaveParams {
  subtopicId: string;
  navigationNodeId: string; // Phase 1: Required for page identity
  brandId: TutorialSidebarBrandId;
  documentBlocks: BlockInstance[];
  loadedSectionId: string | null;
  isLoadingDocument: boolean;
}

export interface TutorialSaveResult {
  success: boolean;
  message: string;
  sectionId?: string;
}

/**
 * Save tutorial section (CREATE or UPDATE based on existence)
 * Phase 1: Uses (subtopicId, navigationNodeId, brandId) for identity
 * 
 * @param params - Save parameters including navigation context
 * @param status - Tutorial status ('draft' or 'published')
 * @returns Save result with success status and message
 */
export async function saveTutorialSection(
  params: TutorialSaveParams,
  status: 'draft' | 'published'
): Promise<TutorialSaveResult> {
  const {
    subtopicId,
    navigationNodeId,
    brandId,
    documentBlocks,
    loadedSectionId,
    isLoadingDocument,
  } = params;

  // Validation
  if (!subtopicId) {
    return {
      success: false,
      message: 'Subtopic is required',
    };
  }

  // Phase 1: Require navigationNodeId for save
  if (!navigationNodeId) {
    return {
      success: false,
      message: 'Navigation Node is required',
    };
  }

  if (isLoadingDocument) {
    return {
      success: false,
      message: 'Tutorial is still loading. Please wait before saving.',
    };
  }

  try {
    // Step 1: Map documentBlocks[] → TutorialDocument.blocks[]
    const tutorialBlocks: TutorialBlock[] = documentBlocks.map(toTutorialBlock);

    // Step 2: Create TutorialDocument
    const tutorialDocument: TutorialDocument = {
      schemaVersion: 1,
      blocks: tutorialBlocks,
    };

    // Step 3: Check if tutorial exists for this (subtopicId, navigationNodeId, brandId)
    // Phase 1: Include navigationNodeId in existence check
    const queryParams = new URLSearchParams({
      subtopicId: subtopicId,
      navigationNodeId: navigationNodeId,
      brandId: brandId,
      limit: '1',
    });
    const existenceCheckUrl = `/api/tutorial-composer/sections?${queryParams.toString()}`;

    const queryResponse = await fetch(existenceCheckUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!queryResponse.ok) {
      throw new Error('Failed to check existing tutorial');
    }

    const queryResult = await queryResponse.json();
    const existingTutorial = queryResult.data?.[0];

    // Step 3b: Race condition protection
    if (
      existingTutorial &&
      loadedSectionId &&
      existingTutorial.id !== loadedSectionId
    ) {
      return {
        success: false,
        message: 'The selected tutorial changed while editing. Reload the document before saving.',
      };
    }

    let response;
    let requestPayload;

    if (existingTutorial) {
      // Step 4a: UPDATE existing tutorial
      const patchUrl = `/api/tutorial-composer/sections/${existingTutorial.id}`;
      requestPayload = {
        content: tutorialDocument,
      };

      response = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
    } else {
      // Step 4b: CREATE new tutorial
      // Phase 1: Include navigationNodeId for page-specific tutorial identity
      requestPayload = {
        subtopicId: subtopicId,
        navigationNodeId: navigationNodeId, // Phase 1: Required
        brandId: brandId,
        content: tutorialDocument,
        orderIndex: 0,
      };

      response = await fetch('/api/tutorial-composer/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });
    }

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result.error?.message || result.error || 'Save failed';
      throw new Error(errorMsg);
    }

    // Success
    const action = existingTutorial ? 'updated' : 'created';
    return {
      success: true,
      message: `Tutorial ${action} successfully with ${tutorialBlocks.length} block(s).`,
      sectionId: result.data?.id,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Save failed.',
    };
  }
}
