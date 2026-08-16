/**
 * Tutorial Delivery Service
 * 
 * PROMPT 10 — Tutorial Section / Delivery Foundation
 * 
 * Responsibilities:
 * - Retrieve published tutorial sections for learners
 * - Filter by brand visibility, deletion status, publication status
 * - Order sections correctly by orderIndex
 * - Validate TutorialDocument content at trust boundary
 * - Return only learner-safe data (no admin metadata)
 * 
 * This service sits between the learner-facing API and the database,
 * providing a clean separation of concerns and reusable delivery logic.
 */

import { db } from '../db';
import { tutorialSections, tutorialSubtopics } from '../schema';
import { eq, and, inArray, isNull, or } from 'drizzle-orm';
import { TutorialDocumentSchema, type TutorialDocument } from '@quiz/types';
import type { TutorialDifficulty, SectionType, Brand } from '@quiz/types';
import { tutorialContentSanitizationService } from './tutorial-content-sanitization.service';

/**
 * Delivery-safe section data
 * Excludes admin-only fields like:
 * - AI generation metadata
 * - Approval workflow data
 * - Internal IDs (generation jobs, etc.)
 * - Architecture references
 */
export interface DeliverySection {
  id: string;
  sectionType: SectionType;
  difficulty: TutorialDifficulty;
  orderIndex: number;
  content: TutorialDocument;
  version: number;
  language: string;
  publishedAt: Date | null;
}

/**
 * Complete tutorial delivery for a subtopic
 */
export interface TutorialDelivery {
  subtopicId: string;
  subtopicSlug: string;
  subtopicName: string;
  difficulty: TutorialDifficulty;
  sections: DeliverySection[];
  totalSections: number;
}

/**
 * Options for tutorial delivery
 */
export interface DeliveryOptions {
  difficulty?: TutorialDifficulty;
  sectionType?: SectionType;
  brandId?: Brand;
  includeUnpublished?: boolean; // For admin preview, defaults to false
}

/**
 * Tutorial Delivery Service
 */
export class TutorialDeliveryService {
  /**
   * Get tutorial sections for a subtopic (by slug)
   */
  async getTutorialBySlug(
    subtopicSlug: string,
    options: DeliveryOptions = {}
  ): Promise<TutorialDelivery> {
    // Resolve subtopic
    const [subtopic] = await db
      .select({
        id: tutorialSubtopics.id,
        slug: tutorialSubtopics.slug,
        name: tutorialSubtopics.name,
      })
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.slug, subtopicSlug))
      .limit(1);

    if (!subtopic) {
      throw new SubtopicNotFoundError(subtopicSlug);
    }

    return this.getTutorialById(subtopic.id, {
      ...options,
      _subtopicMetadata: {
        slug: subtopic.slug,
        name: subtopic.name,
      },
    });
  }

  /**
   * Get tutorial sections for a subtopic (by UUID)
   */
  async getTutorialById(
    subtopicId: string,
    options: DeliveryOptions & { _subtopicMetadata?: { slug: string; name: string } } = {}
  ): Promise<TutorialDelivery> {
    const {
      difficulty = 'simple',
      sectionType,
      brandId = 'shared',
      includeUnpublished = false,
      _subtopicMetadata,
    } = options;

    // If no metadata provided, fetch it
    let subtopicMetadata = _subtopicMetadata;
    if (!subtopicMetadata) {
      const [subtopic] = await db
        .select({
          slug: tutorialSubtopics.slug,
          name: tutorialSubtopics.name,
        })
        .from(tutorialSubtopics)
        .where(eq(tutorialSubtopics.id, subtopicId))
        .limit(1);

      if (!subtopic) {
        throw new SubtopicNotFoundError(subtopicId);
      }

      subtopicMetadata = subtopic;
    }

    // Build query conditions
    const conditions = [
      eq(tutorialSections.subtopicId, subtopicId),
      eq(tutorialSections.difficulty, difficulty),
      isNull(tutorialSections.deletedAt), // Exclude soft-deleted sections
    ];

    // Filter by section type if specified
    if (sectionType) {
      conditions.push(eq(tutorialSections.sectionType, sectionType));
    }

    // Filter by publication status (default: only published)
    if (!includeUnpublished) {
      conditions.push(
        inArray(tutorialSections.status, ['approved', 'deployed'])
      );
    }

    // Filter by brand visibility
    // Sections visible if:
    // 1. brandId = 'shared' (universal content)
    // 2. brandId = requested brand (brand-specific)
    // 3. brandVisibility = 'shared_visible' (cross-brand visible)
    conditions.push(
      or(
        eq(tutorialSections.brandId, 'shared'),
        eq(tutorialSections.brandId, brandId),
        eq(tutorialSections.brandVisibility, 'shared_visible')
      )!
    );

    // Query sections
    const rawSections = await db
      .select({
        id: tutorialSections.id,
        sectionType: tutorialSections.sectionType,
        difficulty: tutorialSections.difficulty,
        orderIndex: tutorialSections.orderIndex,
        content: tutorialSections.content,
        version: tutorialSections.version,
        language: tutorialSections.language,
        publishedAt: tutorialSections.publishedAt,
      })
      .from(tutorialSections)
      .where(and(...conditions))
      .orderBy(tutorialSections.orderIndex); // Order by orderIndex

    // Validate and transform sections
    const deliverySections: DeliverySection[] = [];

    for (const rawSection of rawSections) {
      // CRITICAL: Validate TutorialDocument schema at trust boundary
      const validationResult = TutorialDocumentSchema.safeParse(rawSection.content);

      if (!validationResult.success) {
        console.error('[TutorialDeliveryService] Schema validation failed', {
          sectionId: rawSection.id,
          sectionType: rawSection.sectionType,
          errors: validationResult.error.errors,
        });
        // Skip invalid sections in production
        continue;
      }

      // CRITICAL: Sanitize content before delivery
      // This is the security boundary between DB and learners
      const sanitizationResult = tutorialContentSanitizationService.sanitizeDocument(
        validationResult.data
      );

      // Log security warnings if content was modified
      if (sanitizationResult.modified) {
        console.warn('[TutorialDeliveryService] Content sanitized', {
          sectionId: rawSection.id,
          warningCount: sanitizationResult.warnings.length,
          warningTypes: sanitizationResult.warnings.map(w => w.split(':')[1]?.trim() || 'unknown'),
        });
      }

      deliverySections.push({
        id: rawSection.id,
        sectionType: rawSection.sectionType as SectionType,
        difficulty: rawSection.difficulty as TutorialDifficulty,
        orderIndex: rawSection.orderIndex,
        content: sanitizationResult.sanitized, // Use sanitized content
        version: rawSection.version,
        language: rawSection.language,
        publishedAt: rawSection.publishedAt,
      });
    }

    return {
      subtopicId,
      subtopicSlug: subtopicMetadata.slug,
      subtopicName: subtopicMetadata.name,
      difficulty,
      sections: deliverySections,
      totalSections: deliverySections.length,
    };
  }

  /**
   * Get a single section by ID
   * Used for direct section access (e.g., deep links)
   */
  async getSectionById(
    sectionId: string,
    options: { brandId?: Brand } = {}
  ): Promise<DeliverySection> {
    const { brandId = 'shared' } = options;

    const [rawSection] = await db
      .select({
        id: tutorialSections.id,
        sectionType: tutorialSections.sectionType,
        difficulty: tutorialSections.difficulty,
        orderIndex: tutorialSections.orderIndex,
        content: tutorialSections.content,
        version: tutorialSections.version,
        language: tutorialSections.language,
        publishedAt: tutorialSections.publishedAt,
        deletedAt: tutorialSections.deletedAt,
        status: tutorialSections.status,
        brandId: tutorialSections.brandId,
        brandVisibility: tutorialSections.brandVisibility,
      })
      .from(tutorialSections)
      .where(eq(tutorialSections.id, sectionId))
      .limit(1);

    if (!rawSection) {
      throw new SectionNotFoundError(sectionId);
    }

    // Verify section is published and not deleted
    if (rawSection.deletedAt) {
      throw new SectionNotFoundError(sectionId);
    }

    if (!['approved', 'deployed'].includes(rawSection.status)) {
      throw new SectionNotFoundError(sectionId);
    }

    // Verify brand access
    const hasAccess =
      rawSection.brandId === 'shared' ||
      rawSection.brandId === brandId ||
      rawSection.brandVisibility === 'shared_visible';

    if (!hasAccess) {
      throw new SectionNotFoundError(sectionId);
    }

    // Validate content
    const validationResult = TutorialDocumentSchema.safeParse(rawSection.content);

    if (!validationResult.success) {
      console.error('[TutorialDeliveryService] Schema validation failed for single section', {
        sectionId,
        errors: validationResult.error.errors,
      });
      throw new InvalidSectionContentError(sectionId);
    }

    // CRITICAL: Sanitize content before delivery
    const sanitizationResult = tutorialContentSanitizationService.sanitizeDocument(
      validationResult.data
    );

    // Log security warnings if content was modified
    if (sanitizationResult.modified) {
      console.warn('[TutorialDeliveryService] Single section content sanitized', {
        sectionId,
        warningCount: sanitizationResult.warnings.length,
        warningTypes: sanitizationResult.warnings.map(w => w.split(':')[1]?.trim() || 'unknown'),
      });
    }

    return {
      id: rawSection.id,
      sectionType: rawSection.sectionType as SectionType,
      difficulty: rawSection.difficulty as TutorialDifficulty,
      orderIndex: rawSection.orderIndex,
      content: sanitizationResult.sanitized, // Use sanitized content
      version: rawSection.version,
      language: rawSection.language,
      publishedAt: rawSection.publishedAt,
    };
  }
}

/**
 * Errors
 */
export class SubtopicNotFoundError extends Error {
  constructor(slugOrId: string) {
    super(`Subtopic not found: ${slugOrId}`);
    this.name = 'SubtopicNotFoundError';
  }
}

export class SectionNotFoundError extends Error {
  constructor(sectionId: string) {
    super(`Section not found: ${sectionId}`);
    this.name = 'SectionNotFoundError';
  }
}

export class InvalidSectionContentError extends Error {
  constructor(sectionId: string) {
    super(`Section content failed schema validation: ${sectionId}`);
    this.name = 'InvalidSectionContentError';
  }
}

/**
 * Singleton instance
 */
export const tutorialDeliveryService = new TutorialDeliveryService();
