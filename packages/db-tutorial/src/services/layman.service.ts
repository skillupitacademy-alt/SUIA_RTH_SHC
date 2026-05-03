/**
 * Layman Section Service
 * Phase 2B - Backend Service Layer
 * ---------------------------------
 * Business logic orchestration for Layman sections
 */

import { LaymanRepository } from '../repositories/layman.repository';
import { LaymanValidator } from '../validators/layman.validator';
import type {
  LaymanSectionWithArchitectures,
  LaymanSectionCreateInput,
  LaymanSectionUpdateInput,
  LaymanSectionQueryFilters,
  LaymanGenerationRequest,
  LaymanPublishOptions,
  LaymanArchiveOptions,
  LaymanValidationResult,
} from '../types/layman.types';

/**
 * Layman Service Error
 */
export class LaymanServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'LaymanServiceError';
  }
}

/**
 * Layman Service
 * Orchestrates Layman section operations with constitutional compliance
 */
export class LaymanService {
  constructor(
    private repository: LaymanRepository = new LaymanRepository(),
    private validator: LaymanValidator = new LaymanValidator()
  ) {}

  /**
   * Create a new Layman section
   */
  async createLaymanSection(input: LaymanSectionCreateInput): Promise<LaymanSectionWithArchitectures> {
    // Validate brand
    const brandValidation = this.validator.validateBrandSafety(input.brandId);
    if (!brandValidation.isValid) {
      throw new LaymanServiceError(
        brandValidation.errors.join(', '),
        'INVALID_BRAND',
        400
      );
    }

    // Check if section already exists
    const existing = await this.repository.getLaymanSectionBySubtopicId(
      input.subtopicId,
      input.brandId as any
    );
    if (existing) {
      throw new LaymanServiceError(
        'Layman section already exists for this subtopic',
        'SECTION_EXISTS',
        409
      );
    }

    // Get educational architecture
    const educationalArchName = input.educationalArchitectureName || 'Beginner-Friendly';
    const educationalArch = await this.repository.getEducationalArchitecture(educationalArchName);
    if (!educationalArch) {
      throw new LaymanServiceError(
        `Educational architecture not found: ${educationalArchName}`,
        'ARCHITECTURE_NOT_FOUND',
        404
      );
    }

    // Get UI architecture
    const uiArchName = input.uiArchitectureName || 'Standard Interactive';
    const uiArch = await this.repository.getUIArchitecture(uiArchName);
    if (!uiArch) {
      throw new LaymanServiceError(
        `UI architecture not found: ${uiArchName}`,
        'ARCHITECTURE_NOT_FOUND',
        404
      );
    }

    // Validate content if provided
    if (input.content) {
      const contentValidation = this.validator.validateSubsections(input.content);
      if (!contentValidation.isValid) {
        throw new LaymanServiceError(
          contentValidation.errors.join(', '),
          'INVALID_CONTENT',
          400
        );
      }
    }

    // Create section
    const section = await this.repository.createLaymanSection({
      ...input,
      educationalArchitectureId: educationalArch.id,
      uiArchitectureId: uiArch.id,
    });

    // Increment usage counts
    await this.repository.incrementEducationalArchitectureUsage(educationalArch.id);
    await this.repository.incrementUIArchitectureUsage(uiArch.id);

    return section;
  }

  /**
   * Get Layman section by subtopic ID
   */
  async getLaymanSectionBySubtopicId(
    subtopicId: string,
    brandId: string
  ): Promise<LaymanSectionWithArchitectures | null> {
    const section = await this.repository.getLaymanSectionBySubtopicId(subtopicId, brandId as any);
    return section || null;
  }

  /**
   * Get Layman section by ID
   */
  async getLaymanSectionById(sectionId: string): Promise<LaymanSectionWithArchitectures | null> {
    const section = await this.repository.getLaymanSectionById(sectionId);
    return section || null;
  }

  /**
   * Query Layman sections
   */
  async queryLaymanSections(filters: LaymanSectionQueryFilters): Promise<LaymanSectionWithArchitectures[]> {
    return this.repository.queryLaymanSections(filters);
  }

  /**
   * Update Layman section
   */
  async updateLaymanSection(
    sectionId: string,
    updates: LaymanSectionUpdateInput
  ): Promise<LaymanSectionWithArchitectures> {
    // Get existing section
    const existing = await this.repository.getLaymanSectionById(sectionId);
    if (!existing) {
      throw new LaymanServiceError('Layman section not found', 'SECTION_NOT_FOUND', 404);
    }

    // Validate content if provided
    if (updates.content) {
      const contentValidation = this.validator.validateSubsections(updates.content);
      if (!contentValidation.isValid) {
        throw new LaymanServiceError(
          contentValidation.errors.join(', '),
          'INVALID_CONTENT',
          400
        );
      }
    }

    // Update section
    const updated = await this.repository.updateLaymanSection(sectionId, updates);
    if (!updated) {
      throw new LaymanServiceError('Failed to update section', 'UPDATE_FAILED', 500);
    }

    return updated;
  }

  /**
   * Publish Layman section
   */
  async publishLaymanSection(
    sectionId: string,
    options: LaymanPublishOptions
  ): Promise<LaymanSectionWithArchitectures> {
    // Get existing section
    const existing = await this.repository.getLaymanSectionById(sectionId);
    if (!existing) {
      throw new LaymanServiceError('Layman section not found', 'SECTION_NOT_FOUND', 404);
    }

    // Validate deployment readiness unless skipped
    if (!options.skipValidation) {
      const validation = this.validator.validateDeploymentReadiness(existing);
      if (!validation.isValid) {
        throw new LaymanServiceError(
          `Section not ready for deployment: ${validation.errors.join(', ')}`,
          'NOT_DEPLOYMENT_READY',
          400
        );
      }
    }

    // Publish section
    const published = await this.repository.publishLaymanSection(sectionId, options.publishedBy);
    if (!published) {
      throw new LaymanServiceError('Failed to publish section', 'PUBLISH_FAILED', 500);
    }

    return published;
  }

  /**
   * Archive Layman section
   */
  async archiveLaymanSection(
    sectionId: string,
    options: LaymanArchiveOptions
  ): Promise<LaymanSectionWithArchitectures> {
    // Get existing section
    const existing = await this.repository.getLaymanSectionById(sectionId);
    if (!existing) {
      throw new LaymanServiceError('Layman section not found', 'SECTION_NOT_FOUND', 404);
    }

    // Archive section
    const archived = await this.repository.archiveLaymanSection(sectionId, options.archivedBy);
    if (!archived) {
      throw new LaymanServiceError('Failed to archive section', 'ARCHIVE_FAILED', 500);
    }

    return archived;
  }

  /**
   * Validate Layman section
   */
  async validateLaymanSection(sectionId: string): Promise<LaymanValidationResult> {
    const section = await this.repository.getLaymanSectionById(sectionId);
    if (!section) {
      throw new LaymanServiceError('Layman section not found', 'SECTION_NOT_FOUND', 404);
    }

    return this.validator.validateComplete(section);
  }

  /**
   * Generate Layman section (placeholder for AI integration)
   */
  async generateLaymanSection(request: LaymanGenerationRequest): Promise<LaymanSectionWithArchitectures> {
    // Validate brand
    const brandValidation = this.validator.validateBrandSafety(request.brandId);
    if (!brandValidation.isValid) {
      throw new LaymanServiceError(
        brandValidation.errors.join(', '),
        'INVALID_BRAND',
        400
      );
    }

    // Get prompt template
    const templateName = request.promptTemplateName || 'Layman Master Template v1';
    const promptTemplate = await this.repository.getPromptTemplateByName(
      templateName,
      request.brandId as any
    );
    if (!promptTemplate) {
      throw new LaymanServiceError(
        `Prompt template not found: ${templateName}`,
        'TEMPLATE_NOT_FOUND',
        404
      );
    }

    // Validate prompt template
    const templateValidation = this.validator.validatePromptTemplate(templateName);
    if (!templateValidation.isValid) {
      throw new LaymanServiceError(
        templateValidation.errors.join(', '),
        'INVALID_TEMPLATE',
        400
      );
    }

    // Get educational architecture
    const educationalArchName = request.educationalArchitectureName || 'Beginner-Friendly';
    const educationalArch = await this.repository.getEducationalArchitecture(educationalArchName);
    if (!educationalArch) {
      throw new LaymanServiceError(
        `Educational architecture not found: ${educationalArchName}`,
        'ARCHITECTURE_NOT_FOUND',
        404
      );
    }

    // TODO: Integrate with AI generation pipeline
    // For now, create a draft section with placeholder content
    const section = await this.createLaymanSection({
      subtopicId: request.subtopicId,
      brandId: request.brandId,
      educationalArchitectureName: educationalArchName,
      uiArchitectureName: 'Standard Interactive',
      content: {
        subsections: {
          analogy: `[AI Generated] Analogy for ${request.topicName}`,
          beginnerBreakdown: `[AI Generated] Beginner breakdown for ${request.topicName}`,
          mentalModel: `[AI Generated] Mental model for ${request.topicName}`,
          useCase: `[AI Generated] Use case for ${request.topicName}`,
          faq: [
            {
              question: `What is ${request.topicName}?`,
              answer: '[AI Generated] Answer',
            },
          ],
          summary: `[AI Generated] Summary for ${request.topicName}`,
        },
      },
      createdBy: request.requestedBy,
    });

    // Increment prompt template usage
    await this.repository.incrementPromptTemplateUsage(promptTemplate.id);

    return section;
  }

  /**
   * Get section statistics
   */
  async getSectionStatistics(sectionId: string): Promise<{
    version: number;
    status: string;
    wordCount: number;
    subsectionCount: number;
    lastUpdated: Date;
  }> {
    const section = await this.repository.getLaymanSectionById(sectionId);
    if (!section) {
      throw new LaymanServiceError('Layman section not found', 'SECTION_NOT_FOUND', 404);
    }

    const content = section.content as any;
    const subsections = content?.subsections || {};
    
    let wordCount = 0;
    Object.values(subsections).forEach((value: any) => {
      if (typeof value === 'string') {
        wordCount += value.trim().split(/\s+/).length;
      }
    });

    return {
      version: section.version,
      status: section.status,
      wordCount,
      subsectionCount: Object.keys(subsections).length,
      lastUpdated: section.updatedAt,
    };
  }
}
