/**
 * Tutorial Composer Service
 * Business logic layer for NEW Tutorial Composer
 * 
 * ARCHITECTURE:
 * - Uses TutorialDocument as canonical content model
 * - Validates documents before persistence
 * - NO legacy transformation
 * - NO child table writes
 * - Operates ONLY on tutorial_sections.content
 */

import {
  TutorialDocumentSchema,
  validateDocumentForSection,
  type TutorialDocument,
  type SectionType,
  type Difficulty,
  TutorialDocumentValidationError,
  SectionNotFoundError,
  SectionAlreadyExistsError,
  InvalidStatusTransitionError,
} from '@quiz/types';
import type { TutorialSection } from '../schema/tutorial-sections';
import {
  TutorialSectionRepository,
  type CreateTutorialSectionInput,
  type UpdateTutorialSectionInput,
  type TutorialSectionFilters,
} from '../repositories/tutorial-section.repository';

/**
 * Service context (from authenticated request)
 */
export interface TutorialComposerServiceContext {
  userId: string;
  // Add other auth context as needed (portalIdentity, brandId, etc.)
}

/**
 * Create section input (service layer)
 */
export interface CreateSectionInput {
  subtopicId: string;
  sectionType: SectionType;
  difficulty: Difficulty;
  content: TutorialDocument;
  brandId?: string;
  orderIndex?: number;
}

/**
 * Update section input (service layer)
 */
export interface UpdateSectionInput {
  content?: TutorialDocument;
  difficulty?: Difficulty;
  orderIndex?: number;
}

/**
 * Tutorial Composer Service
 * Orchestrates business logic for tutorial section management
 */
export class TutorialComposerService {
  constructor(
    private readonly repository: TutorialSectionRepository = new TutorialSectionRepository()
  ) {}

  /**
   * Create a new tutorial section
   * 
   * Validates:
   * 1. TutorialDocument schema
   * 2. Section-specific block palette
   * 3. No duplicate section exists
   * 
   * Then persists to tutorial_sections.content
   */
  async createSection(
    input: CreateSectionInput,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Validate TutorialDocument schema
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

    // Step 2: Validate section-specific constraints
    const sectionValidation = validateDocumentForSection(
      document,
      input.sectionType
    );

    if (!sectionValidation.valid) {
      throw new TutorialDocumentValidationError(sectionValidation.errors);
    }

    // Step 3: Check for duplicate section
    const existingSection = await this.repository.getSectionByKey(
      input.subtopicId,
      input.sectionType,
      input.difficulty,
      input.brandId || 'shared'
    );

    if (existingSection) {
      throw new SectionAlreadyExistsError(
        `Section already exists: ${input.sectionType} (${input.difficulty}) for subtopic ${input.subtopicId}`
      );
    }

    // Step 4: Create section
    const repositoryInput: CreateTutorialSectionInput = {
      subtopicId: input.subtopicId,
      sectionType: input.sectionType,
      difficulty: input.difficulty,
      content: document,
      brandId: input.brandId,
      orderIndex: input.orderIndex,
    };

    const section = await this.repository.createSection(repositoryInput);

    // TODO: Add cache invalidation if required by existing infrastructure
    // Example: await cacheService.invalidateSubtopic(input.subtopicId);

    return section;
  }

  /**
   * Get section by ID
   */
  async getSection(sectionId: string): Promise<TutorialSection> {
    const section = await this.repository.getSectionById(sectionId);

    if (!section) {
      throw new SectionNotFoundError(sectionId);
    }

    // Validate that stored content is a valid TutorialDocument
    const parseResult = TutorialDocumentSchema.safeParse(section.content);
    if (!parseResult.success) {
      // Historical data may not be TutorialDocument
      throw new TutorialDocumentValidationError([
        {
          code: 'STORED_DOCUMENT_INVALID',
          message: 'Stored content is not a valid TutorialDocument',
          path: 'content',
        },
      ]);
    }

    return section;
  }

  /**
   * Query sections with filters
   */
  async querySections(
    filters: TutorialSectionFilters,
    limit: number = 20,
    cursor?: string
  ): Promise<{
    sections: TutorialSection[];
    hasMore: boolean;
    nextCursor: string | null;
    total: number;
  }> {
    const [queryResult, total] = await Promise.all([
      this.repository.querySections(filters, limit, cursor),
      this.repository.countSections(filters),
    ]);

    return {
      sections: queryResult.sections,
      hasMore: queryResult.hasMore,
      nextCursor: queryResult.nextCursor,
      total,
    };
  }

  /**
   * Update section
   */
  async updateSection(
    sectionId: string,
    input: UpdateSectionInput,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Load existing section
    const existingSection = await this.repository.getSectionById(sectionId);

    if (!existingSection) {
      throw new SectionNotFoundError(sectionId);
    }

    // TODO: Add authorization check
    // await this.assertCanEditSection(context, existingSection);

    // Step 2: If content is being updated, validate it
    if (input.content !== undefined) {
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

      // Validate section-specific constraints
      const sectionValidation = validateDocumentForSection(
        document,
        existingSection.sectionType
      );

      if (!sectionValidation.valid) {
        throw new TutorialDocumentValidationError(sectionValidation.errors);
      }
    }

    // Step 3: Update section
    const repositoryInput: UpdateTutorialSectionInput = {
      content: input.content,
      difficulty: input.difficulty,
      orderIndex: input.orderIndex,
    };

    const updatedSection = await this.repository.updateSection(
      sectionId,
      repositoryInput
    );

    if (!updatedSection) {
      throw new SectionNotFoundError(sectionId);
    }

    // TODO: Cache invalidation if required
    // await cacheService.invalidateSubtopic(updatedSection.subtopicId);

    return updatedSection;
  }

  /**
   * Publish section
   * Changes status to 'deployed' and sets publishedAt
   */
  async publishSection(
    sectionId: string,
    context: TutorialComposerServiceContext
  ): Promise<TutorialSection> {
    // Step 1: Load section
    const section = await this.repository.getSectionById(sectionId);

    if (!section) {
      throw new SectionNotFoundError(sectionId);
    }

    // TODO: Add authorization check
    // await this.assertCanPublishSection(context, section);

    // Step 2: Validate document is publishable
    const parseResult = TutorialDocumentSchema.safeParse(section.content);
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

    // Validate section constraints
    const sectionValidation = validateDocumentForSection(
      document,
      section.sectionType
    );

    if (!sectionValidation.valid) {
      throw new TutorialDocumentValidationError(sectionValidation.errors);
    }

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

    // Step 3: Validate status transition
    if (section.status === 'deployed') {
      throw new InvalidStatusTransitionError(section.status, 'deployed');
    }

    // Step 4: Publish
    const publishedSection = await this.repository.publishSection(sectionId);

    if (!publishedSection) {
      throw new SectionNotFoundError(sectionId);
    }

    // TODO: Cache invalidation
    // await cacheService.invalidateSubtopic(publishedSection.subtopicId);

    return publishedSection;
  }

  /**
   * Archive section (soft delete)
   */
  async archiveSection(
    sectionId: string,
    context: TutorialComposerServiceContext
  ): Promise<void> {
    const section = await this.repository.getSectionById(sectionId);

    if (!section) {
      throw new SectionNotFoundError(sectionId);
    }

    // TODO: Add authorization check
    // await this.assertCanArchiveSection(context, section);

    await this.repository.archiveSection(sectionId);

    // TODO: Cache invalidation
    // await cacheService.invalidateSubtopic(section.subtopicId);
  }
}

/**
 * Default service instance
 */
export const tutorialComposerService = new TutorialComposerService();
