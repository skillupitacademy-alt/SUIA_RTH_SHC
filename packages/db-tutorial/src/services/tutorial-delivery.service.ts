/**
 * Tutorial Delivery Service - V2 Architecture
 * 
 * V2 ARCHITECTURE:
 * - Identity: (subtopicId, brandId) - ONE tutorial per subtopic per brand
 * - Content: TutorialDocument JSONB (blocks[])
 * - NO sectionType, NO difficulty taxonomy
 * - Returns single Tutorial with validated, sanitized content
 * 
 * Responsibilities:
 * - Retrieve published tutorials for learners
 * - Filter by brand visibility, deletion status, publication status
 * - Validate TutorialDocument content at trust boundary
 * - Sanitize content before delivery (security boundary)
 * - Return only learner-safe data (no admin metadata)
 * 
 * This service sits between the learner-facing API and the database,
 * providing a clean separation of concerns and reusable delivery logic.
 */

import { db } from '../db';
import { tutorialSections, tutorialSubtopics } from '../schema';
import { eq, and, inArray, isNull, or } from 'drizzle-orm';
import { TutorialDocumentSchema, type TutorialDocument } from '@quiz/types';
import type { Brand } from '@quiz/types';
import { tutorialContentSanitizationService } from './tutorial-content-sanitization.service';
import { TutorialSectionRepository } from '../repositories/tutorial-section.repository';

/**
 * V2 Delivery-safe tutorial data
 * Excludes admin-only fields:
 * - AI generation metadata
 * - Approval workflow data
 * - Internal IDs (generation jobs, etc.)
 * - Architecture references
 * - Legacy fields (sectionType, difficulty)
 */
export interface DeliveredTutorial {
  id: string;
  subtopicId: string;
  brandId: string;
  orderIndex: number;
  content: TutorialDocument;
  version: number;
  language: string;
  publishedAt: Date | null;
}

/**
 * V2 Complete tutorial delivery for a subtopic
 * Returns single tutorial (not array of sections)
 */
export interface TutorialDeliveryV2 {
  subtopicId: string;
  subtopicSlug: string;
  subtopicName: string;
  brandId: string;
  tutorial: DeliveredTutorial | null;
}

/**
 * Phase 1 Options for tutorial delivery
 */
export interface DeliveryOptions {
  brandId?: Brand | 'shared'; // Brand includes 'shared' for universal content
  includeUnpublished?: boolean; // For admin preview, defaults to false
  navigationNodeId?: string; // Phase 1: Optional page identity
}

/**
 * Tutorial Delivery Service - V2
 */
export class TutorialDeliveryService {
  constructor(
    private readonly repository: TutorialSectionRepository = new TutorialSectionRepository()
  ) {}

  /**
   * Phase 1: Get tutorial for a specific page (by subtopic slug + navigationNodeId)
   * Returns tutorial for specific sidebar page
   */
  async getTutorialByPage(
    subtopicId: string,
    navigationNodeId: string,
    options: DeliveryOptions = {}
  ): Promise<TutorialDeliveryV2> {
    // Resolve subtopic
    const [subtopic] = await db
      .select({
        id: tutorialSubtopics.id,
        slug: tutorialSubtopics.slug,
        name: tutorialSubtopics.name,
      })
      .from(tutorialSubtopics)
      .where(eq(tutorialSubtopics.externalId, subtopicId))
      .limit(1);

    if (!subtopic) {
      throw new SubtopicNotFoundError(subtopicId);
    }

    return this.getTutorialById(subtopic.id, {
      ...options,
      navigationNodeId,
      _subtopicMetadata: {
        slug: subtopic.slug,
        name: subtopic.name,
      },
    });
  }

  /**
   * V2: Get tutorial for a subtopic (by slug)
   * Returns single tutorial per (subtopicId, brandId)
   * @deprecated Phase 1: Use getTutorialByPage with navigationNodeId
   */
  async getTutorialBySlug(
    subtopicSlug: string,
    options: DeliveryOptions = {}
  ): Promise<TutorialDeliveryV2> {
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
   * Phase 1: Get tutorial for a subtopic (by UUID)
   * Returns tutorial per (subtopicId, navigationNodeId, brandId) when navigationNodeId provided
   * Falls back to V2 behavior (subtopicId, brandId) for backward compatibility
   * 
   * @param subtopicId - Can be either:
   *   - MainDB subtopic ID (external_id in TutorialDB) - requires resolution
   *   - TutorialDB internal ID when called from getTutorialByPage (skip resolution)
   */
  async getTutorialById(
    subtopicId: string,
    options: DeliveryOptions & { _subtopicMetadata?: { slug: string; name: string } } = {}
  ): Promise<TutorialDeliveryV2> {
    const {
      brandId = 'shared',
      includeUnpublished = false,
      navigationNodeId, // Phase 1: Optional page identity
      _subtopicMetadata,
    } = options;

    // CRITICAL: Resolve MainDB subtopic ID to TutorialDB internal ID
    // When _subtopicMetadata is provided, subtopicId is already the internal ID (from getTutorialByPage)
    // Otherwise, subtopicId is the external ID (from MainDB) and requires resolution
    let internalSubtopicId: string;
    
    if (_subtopicMetadata) {
      // Already resolved: subtopicId is internal ID from getTutorialByPage
      internalSubtopicId = subtopicId;
    } else {
      // External ID: resolve to internal ID
      const resolved = await this.repository.resolveSubtopicId(subtopicId);
      if (!resolved) {
        throw new SubtopicNotFoundError(subtopicId);
      }
      internalSubtopicId = resolved;
    }

    // Fetch subtopic metadata if not provided
    let subtopicMetadata = _subtopicMetadata;
    if (!subtopicMetadata) {
      const [subtopic] = await db
        .select({
          slug: tutorialSubtopics.slug,
          name: tutorialSubtopics.name,
        })
        .from(tutorialSubtopics)
        .where(eq(tutorialSubtopics.id, internalSubtopicId))
        .limit(1);

      if (!subtopic) {
        throw new SubtopicNotFoundError(subtopicId);
      }

      subtopicMetadata = subtopic;
    }

    // Phase 1: Query by (internalSubtopicId, navigationNodeId, brandId) when provided
    const conditions = [
      eq(tutorialSections.subtopicId, internalSubtopicId), // Use TutorialDB internal ID
      isNull(tutorialSections.deletedAt), // Exclude soft-deleted tutorials
    ];

    // Phase 1: Add navigationNodeId filter if provided
    if (navigationNodeId) {
      conditions.push(eq(tutorialSections.navigationNodeId, navigationNodeId));
    }

    // Filter by publication status (default: only published)
    if (!includeUnpublished) {
      conditions.push(
        inArray(tutorialSections.status, ['approved', 'deployed'])
      );
    }

    // Phase 1: Filter by brand visibility
    // Tutorial visible if:
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

    // V2: Query single tutorial (not array)
    const [rawTutorial] = await db
      .select({
        id: tutorialSections.id,
        subtopicId: tutorialSections.subtopicId,
        brandId: tutorialSections.brandId,
        orderIndex: tutorialSections.orderIndex,
        content: tutorialSections.content,
        version: tutorialSections.version,
        language: tutorialSections.language,
        publishedAt: tutorialSections.publishedAt,
      })
      .from(tutorialSections)
      .where(and(...conditions))
      .limit(1);

    // V2: Return structure with nullable tutorial
    if (!rawTutorial) {
      return {
        subtopicId,
        subtopicSlug: subtopicMetadata.slug,
        subtopicName: subtopicMetadata.name,
        brandId,
        tutorial: null,
      };
    }

    // CRITICAL: Validate TutorialDocument schema at trust boundary
    const validationResult = TutorialDocumentSchema.safeParse(rawTutorial.content);

    if (!validationResult.success) {
      console.error('[TutorialDeliveryService] Schema validation failed', {
        tutorialId: rawTutorial.id,
        subtopicId,
        brandId: rawTutorial.brandId,
        errors: validationResult.error.errors,
      });
      // Return null tutorial if invalid (fail safe)
      return {
        subtopicId,
        subtopicSlug: subtopicMetadata.slug,
        subtopicName: subtopicMetadata.name,
        brandId,
        tutorial: null,
      };
    }

    // CRITICAL: Sanitize content before delivery
    // This is the security boundary between DB and learners
    const sanitizationResult = tutorialContentSanitizationService.sanitizeDocument(
      validationResult.data
    );

    // Log security warnings if content was modified
    if (sanitizationResult.modified) {
      console.warn('[TutorialDeliveryService] Content sanitized', {
        tutorialId: rawTutorial.id,
        warningCount: sanitizationResult.warnings.length,
        warningTypes: sanitizationResult.warnings.map(w => w.split(':')[1]?.trim() || 'unknown'),
      });
    }

    const deliveredTutorial: DeliveredTutorial = {
      id: rawTutorial.id,
      subtopicId: rawTutorial.subtopicId,
      brandId: rawTutorial.brandId as string,
      orderIndex: rawTutorial.orderIndex,
      content: sanitizationResult.sanitized, // Use sanitized content
      version: rawTutorial.version,
      language: rawTutorial.language,
      publishedAt: rawTutorial.publishedAt,
    };

    return {
      subtopicId,
      subtopicSlug: subtopicMetadata.slug,
      subtopicName: subtopicMetadata.name,
      brandId,
      tutorial: deliveredTutorial,
    };
  }

  /**
   * V2: Get a single tutorial by tutorial ID
   * Used for direct tutorial access (e.g., deep links, admin preview)
   */
  async getSingleTutorialById(
    tutorialId: string,
    options: { brandId?: Brand } = {}
  ): Promise<DeliveredTutorial> {
    const { brandId = 'shared' } = options;

    const [rawTutorial] = await db
      .select({
        id: tutorialSections.id,
        subtopicId: tutorialSections.subtopicId,
        brandId: tutorialSections.brandId,
        orderIndex: tutorialSections.orderIndex,
        content: tutorialSections.content,
        version: tutorialSections.version,
        language: tutorialSections.language,
        publishedAt: tutorialSections.publishedAt,
        deletedAt: tutorialSections.deletedAt,
        status: tutorialSections.status,
        brandVisibility: tutorialSections.brandVisibility,
      })
      .from(tutorialSections)
      .where(eq(tutorialSections.id, tutorialId))
      .limit(1);

    if (!rawTutorial) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // Verify tutorial is published and not deleted
    if (rawTutorial.deletedAt) {
      throw new TutorialNotFoundError(tutorialId);
    }

    if (!['approved', 'deployed'].includes(rawTutorial.status)) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // Verify brand access
    const hasAccess =
      rawTutorial.brandId === 'shared' ||
      rawTutorial.brandId === brandId ||
      rawTutorial.brandVisibility === 'shared_visible';

    if (!hasAccess) {
      throw new TutorialNotFoundError(tutorialId);
    }

    // Validate content
    const validationResult = TutorialDocumentSchema.safeParse(rawTutorial.content);

    if (!validationResult.success) {
      console.error('[TutorialDeliveryService] Schema validation failed for single tutorial', {
        tutorialId,
        errors: validationResult.error.errors,
      });
      throw new InvalidTutorialContentError(tutorialId);
    }

    // CRITICAL: Sanitize content before delivery
    const sanitizationResult = tutorialContentSanitizationService.sanitizeDocument(
      validationResult.data
    );

    // Log security warnings if content was modified
    if (sanitizationResult.modified) {
      console.warn('[TutorialDeliveryService] Single tutorial content sanitized', {
        tutorialId,
        warningCount: sanitizationResult.warnings.length,
        warningTypes: sanitizationResult.warnings.map(w => w.split(':')[1]?.trim() || 'unknown'),
      });
    }

    return {
      id: rawTutorial.id,
      subtopicId: rawTutorial.subtopicId,
      brandId: rawTutorial.brandId as string,
      orderIndex: rawTutorial.orderIndex,
      content: sanitizationResult.sanitized, // Use sanitized content
      version: rawTutorial.version,
      language: rawTutorial.language,
      publishedAt: rawTutorial.publishedAt,
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

export class TutorialNotFoundError extends Error {
  constructor(tutorialId: string) {
    super(`Tutorial not found: ${tutorialId}`);
    this.name = 'TutorialNotFoundError';
  }
}

export class InvalidTutorialContentError extends Error {
  constructor(tutorialId: string) {
    super(`Tutorial content failed schema validation: ${tutorialId}`);
    this.name = 'InvalidTutorialContentError';
  }
}

/**
 * Singleton instance
 */
export const tutorialDeliveryService = new TutorialDeliveryService();
