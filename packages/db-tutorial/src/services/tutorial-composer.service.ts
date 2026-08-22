/**
 * Tutorial Composer Service - V2 Architecture
 * Business logic layer for Tutorial V2 Composer
 * 
 * V2 ARCHITECTURE:
 * - Identity: (subtopicId, brandId) - ONE tutorial per subtopic per brand
 * - Content: TutorialDocument JSONB (blocks[])
 * - NO sectionType, NO difficulty taxonomy
 * - NO section-specific palettes
 * - Blocks are pedagogical units within single tutorial
 */

import {
  TutorialDocumentSchema,
  type TutorialDocument,
  type TutorialBlock,
  TutorialDocumentValidationError,
  SectionNotFoundError,
  SectionAlreadyExistsError,
  InvalidStatusTransitionError,
} from '@quiz/types';

// V2 Note: Using existing error types temporarily
// SectionNotFoundError → represents Tutorial not found (will be renamed in types package later)
// SectionAlreadyExistsError → represents Tutorial already exists (will be renamed in types package later)
const TutorialNotFoundError = SectionNotFoundError;
const TutorialAlreadyExistsError = SectionAlreadyExistsError;
import type { TutorialSection } from '../schema/tutorial-sections';
import {
  TutorialSectionRepository,
  type CreateTutorialInput,
  type UpdateTutorialContentInput,
  type UpdateTutorialStatusInput,
  type TutorialFilters,
} from '../repositories/tutorial-section.repository';

/**
 * Service context (from authenticated request)
 */
export interface TutorialComposerServiceContext {
  userId: string;
  brandId?: string;
}

/**
 * V2 Create tutorial input (service layer)
 */
export interface CreateTutorialServiceInput {
  subtopicId: string;
  brandId?: string;
  content: TutorialDocument;
  orderIndex?: number;
  promptTemplateId?: string;
  educationalArchitectureId?: string;
  uiArchitectureId?: string;
}

/**
 * V2 Update tutorial content input (service layer)
 */
export interface UpdateTutorialContentServiceInput {
  content: TutorialDocument;
}

/**
 * Tutorial Composer Service - V2
 * Orchestrates business logic for tutorial document management
 */
export class TutorialComposerService {
  constructor(
    private readonly repository: TutorialSectionRepository = new TutorialSectionRepository()
  ) {}

  /**
   * V2: Create a new tutorial
   * 
   * Identity: (subtopicId, brandId)
   * Enforced by database UNIQUE constraint
   * 
   * Validates:
   * 1. TutorialDocument schema
   * 2. No duplicate tutorial exists for this (subtopicId, brandId)
   * 
   * Then persists to tutorial_sections.content
   */
  async createTutorial(
    input: CreateTutorialServiceInput,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    const diagnosticId = `CREATE-TUTORIAL-${Date.now()}`;
    const brandId = input.brandId || context.brandId || 'shared';

    console.log(`[${diagnosticId}] createTutorial - Starting:`, {
      externalSubtopicId: input.subtopicId,
      brandId,
      userId: context.userId,
      blocksCount: input.content?.blocks?.length,
      schemaVersion: input.content?.schemaVersion,
    });

    // Step 1: Resolve external subtopic ID to internal tutorial_subtopics ID
    const internalSubtopicId = await this.repository.resolveSubtopicId(input.subtopicId);
    
    if (!internalSubtopicId) {
      console.error(`[${diagnosticId}] Subtopic not found in tutorial database:`, {
        externalSubtopicId: input.subtopicId,
      });
      throw new Error(`Subtopic ${input.subtopicId} not found in tutorial database. Please sync hierarchy first.`);
    }
    
    console.log(`[${diagnosticId}] Resolved subtopic ID:`, {
      external: input.subtopicId,
      internal: internalSubtopicId,
    });

    // Step 2: Validate TutorialDocument schema
    const parseResult = TutorialDocumentSchema.safeParse(input.content);
    if (!parseResult.success) {
      console.error(`[${diagnosticId}] TutorialDocument validation failed:`, parseResult.error.errors);
      throw new TutorialDocumentValidationError([
        {
          code: 'SCHEMA_INVALID',
          message: 'TutorialDocument schema validation failed',
          path: 'content',
        },
      ]);
    }

    const document: TutorialDocument = parseResult.data as TutorialDocument;
    
    console.log(`[${diagnosticId}] TutorialDocument validation passed`);

    // Step 3: Check for duplicate tutorial (internalSubtopicId, brandId) already exists
    console.log(`[${diagnosticId}] Checking for existing tutorial:`, { internalSubtopicId, brandId });
    
    const existingTutorial = await this.repository.getTutorialBySubtopic(
      internalSubtopicId,
      brandId
    );

    if (existingTutorial) {
      console.log(`[${diagnosticId}] Tutorial already exists:`, {
        id: existingTutorial.id,
        status: existingTutorial.status,
      });
      throw new TutorialAlreadyExistsError(
        `Tutorial already exists for subtopic ${input.subtopicId} and brand ${brandId}`
      );
    }
    
    console.log(`[${diagnosticId}] No existing tutorial found - proceeding with creation`);

    // Step 4: Create tutorial with internal subtopic ID (satisfies FK constraint)
    const repositoryInput: CreateTutorialInput = {
      subtopicId: internalSubtopicId, // Internal tutorial_subtopics.id (NOT external_id)
      brandId,
      content: document,
      orderIndex: input.orderIndex,
      promptTemplateId: input.promptTemplateId,
      educationalArchitectureId: input.educationalArchitectureId,
      uiArchitectureId: input.uiArchitectureId,
    };
    
    console.log(`[${diagnosticId}] Calling repository.createTutorial with:`, {
      subtopicId: repositoryInput.subtopicId,
      brandId: repositoryInput.brandId,
      orderIndex: repositoryInput.orderIndex,
      hasContent: !!repositoryInput.content,
    });

    try {
      const tutorial = await this.repository.createTutorial(repositoryInput);
      
      console.log(`[${diagnosticId}] Tutorial created successfully:`, {
        id: tutorial.id,
        subtopicId: tutorial.subtopicId,
        status: tutorial.status,
      });
      
      return tutorial;
    } catch (error) {
      console.error(`[${diagnosticId}] Repository createTutorial failed:`, {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorDetail: (error as any)?.detail,
        errorConstraint: (error as any)?.constraint,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }

    // TODO: Add cache invalidation if required by existing infrastructure
    // Example: await cacheService.invalidateSubtopic(input.subtopicId);
  }

  /**
   * V2: Get tutorial by ID
   */
  async getTutorial(tutorialId: string): Promise<TutorialSection> {
    const tutorial = await this.repository.getTutorialById(tutorialId);

    if (!tutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // Validate that stored content is a valid TutorialDocument
    const parseResult = TutorialDocumentSchema.safeParse(tutorial.content);
    if (!parseResult.success) {
      throw new TutorialDocumentValidationError([
        {
          code: 'STORED_DOCUMENT_INVALID',
          message: 'Stored content is not a valid TutorialDocument',
          path: 'content',
        },
      ]);
    }

    return tutorial;
  }

  /**
   * V2: Get tutorial by subtopic and brand
   */
  async getTutorialBySubtopic(
    subtopicId: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection | null> {
    const tutorial = await this.repository.getTutorialBySubtopic(
      subtopicId,
      brandId
    );
    return tutorial ?? null;
  }

  /**
   * V2: Query tutorials with filters
   */
  async queryTutorials(
    filters: TutorialFilters,
    limit: number = 20,
    cursor?: string
  ): Promise<{
    tutorials: TutorialSection[];
    hasMore: boolean;
    nextCursor: string | null;
    total: number;
  }> {
    // Resolve external subtopic ID to internal if provided
    let internalSubtopicId = filters.subtopicId;
    if (filters.subtopicId) {
      const resolved = await this.repository.resolveSubtopicId(filters.subtopicId);
      if (!resolved) {
        // Subtopic doesn't exist in tutorial DB - return empty result
        return {
          tutorials: [],
          hasMore: false,
          nextCursor: null,
          total: 0,
        };
      }
      internalSubtopicId = resolved;
    }

    const [queryResult, total] = await Promise.all([
      this.repository.queryTutorials({ ...filters, subtopicId: internalSubtopicId }, limit, cursor),
      this.repository.countTutorials({ ...filters, subtopicId: internalSubtopicId }),
    ]);

    return {
      tutorials: queryResult.tutorials,
      hasMore: queryResult.hasMore,
      nextCursor: queryResult.nextCursor,
      total,
    };
  }

  /**
   * V2: Update tutorial content
   */
  async updateTutorialContent(
    tutorialId: string,
    input: UpdateTutorialContentServiceInput,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Load existing tutorial
    const existingTutorial = await this.repository.getTutorialById(tutorialId);

    if (!existingTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Add authorization check
    // await this.assertCanEditTutorial(context, existingTutorial);

    // Step 2: Validate new content
    const parseResult = TutorialDocumentSchema.safeParse(input.content);
    if (!parseResult.success) {
      throw new TutorialDocumentValidationError([
        {
          code: 'SCHEMA_INVALID',
          message: 'TutorialDocument schema validation failed',
          path: 'content',
        },
      ]);
    }

    const document: TutorialDocument = parseResult.data as TutorialDocument;

    // Step 3: Update tutorial
    const repositoryInput: UpdateTutorialContentInput = {
      content: document,
    };

    const updatedTutorial = await this.repository.updateTutorialContent(
      tutorialId,
      repositoryInput
    );

    if (!updatedTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Cache invalidation if required
    // await cacheService.invalidateSubtopic(updatedTutorial.subtopicId);

    return updatedTutorial;
  }

  /**
   * V2: Update tutorial status
   */
  async updateTutorialStatus(
    tutorialId: string,
    input: UpdateTutorialStatusInput,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Load tutorial
    const tutorial = await this.repository.getTutorialById(tutorialId);

    if (!tutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Add authorization check
    // await this.assertCanUpdateTutorialStatus(context, tutorial);

    // Step 2: Validate status transition
    if (tutorial.status === input.status) {
      // No-op if status unchanged
      return tutorial;
    }

    // Step 3: Update status
    const updatedTutorial = await this.repository.updateTutorialStatus(
      tutorialId,
      input
    );

    if (!updatedTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Cache invalidation
    // await cacheService.invalidateSubtopic(updatedTutorial.subtopicId);

    return updatedTutorial;
  }

  /**
   * V2: Publish tutorial
   * Changes status to 'deployed' and sets publishedAt
   */
  async publishTutorial(
    tutorialId: string,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Load tutorial
    const tutorial = await this.repository.getTutorialById(tutorialId);

    if (!tutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Add authorization check
    // await this.assertCanPublishTutorial(context, tutorial);

    // Step 2: Validate document is publishable
    const parseResult = TutorialDocumentSchema.safeParse(tutorial.content);
    if (!parseResult.success) {
      throw new TutorialDocumentValidationError([
        {
          code: 'DOCUMENT_NOT_PUBLISHABLE',
          message: 'Document must be valid before publishing',
          path: 'content',
        },
      ]);
    }

    const document: TutorialDocument = parseResult.data as TutorialDocument;

    // Check document is not empty (business rule)
    if (document.blocks.length === 0) {
      throw new TutorialDocumentValidationError([
        {
          code: 'DOCUMENT_EMPTY',
          message: 'Cannot publish empty document',
          path: 'content.blocks',
        },
      ]);
    }

    // Step 3: Allow republishing
    // If already deployed, this is a deliberate republish operation
    // The repository will update publishedAt timestamp
    // No status transition error for deployed → deployed

    // Step 4: Publish
    const publishedTutorial = await this.repository.publishTutorial(tutorialId);

    if (!publishedTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Cache invalidation
    // await cacheService.invalidateSubtopic(publishedTutorial.subtopicId);

    return publishedTutorial;
  }

  /**
   * V2: Archive tutorial (soft delete)
   */
  async archiveTutorial(
    tutorialId: string,
    context: TutorialComposerServiceContext
  ): Promise<void> {
    const tutorial = await this.repository.getTutorialById(tutorialId);

    if (!tutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Add authorization check
    // await this.assertCanArchiveTutorial(context, tutorial);

    await this.repository.archiveTutorial(tutorialId);

    // TODO: Cache invalidation
    // await cacheService.invalidateSubtopic(tutorial.subtopicId);
  }

  /**
   * V2: Append block to existing tutorial
   * 
   * This method:
   * 1. Loads existing tutorial by ID
   * 2. Validates new block
   * 3. Appends block to document.blocks[]
   * 4. Validates complete document
   * 5. Persists updated document
   * 
   * IMPORTANT: This does NOT create a new tutorial.
   * It updates an existing tutorial's TutorialDocument.
   * Multiple blocks of the same type (D1, D1, C1, C1) are allowed.
   */
  async appendBlockToTutorial(
    tutorialId: string,
    newBlock: TutorialBlock,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Load existing tutorial
    const existingTutorial = await this.repository.getTutorialById(tutorialId);

    if (!existingTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Add authorization check
    // await this.assertCanEditTutorial(context, existingTutorial);

    // Step 2: Parse existing content as TutorialDocument
    const parseResult = TutorialDocumentSchema.safeParse(existingTutorial.content);
    if (!parseResult.success) {
      throw new TutorialDocumentValidationError([
        {
          code: 'STORED_DOCUMENT_INVALID',
          message: 'Existing tutorial content is not a valid TutorialDocument',
          path: 'content',
        },
      ]);
    }

    const existingDocument: TutorialDocument = parseResult.data as TutorialDocument;

    // Step 3: Create updated document with appended block
    const updatedDocument: TutorialDocument = {
      ...existingDocument,
      blocks: [
        ...existingDocument.blocks,
        newBlock,
      ],
    };

    // Step 4: Validate updated document schema
    const updatedParseResult = TutorialDocumentSchema.safeParse(updatedDocument);
    if (!updatedParseResult.success) {
      throw new TutorialDocumentValidationError([
        {
          code: 'SCHEMA_INVALID',
          message: 'Updated TutorialDocument schema validation failed after appending block',
          path: 'content',
        },
      ]);
    }

    const validatedDocument: TutorialDocument = updatedParseResult.data as TutorialDocument;

    // Step 5: Update tutorial with appended block
    const repositoryInput: UpdateTutorialContentInput = {
      content: validatedDocument,
    };

    const updatedTutorial = await this.repository.updateTutorialContent(
      tutorialId,
      repositoryInput
    );

    if (!updatedTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // TODO: Cache invalidation
    // await cacheService.invalidateSubtopic(updatedTutorial.subtopicId);

    return updatedTutorial;
  }

  /**
   * LEGACY COMPATIBILITY ALIAS - DEPRECATED
   * Use appendBlockToTutorial() instead
   * 
   * @deprecated Use appendBlockToTutorial()
   */
  async appendBlockToSection(
    sectionId: string,
    newBlock: TutorialBlock,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    return this.appendBlockToTutorial(sectionId, newBlock, context);
  }
}

/**
 * Default service instance
 */
export const tutorialComposerService = new TutorialComposerService();
