/**
 * Tutorial Section Repository - V2 Architecture
 * Data access layer for tutorial_sections table
 * 
 * V2 ARCHITECTURE:
 * - Identity: (subtopic_id, brand_id) - ONE tutorial per subtopic per brand
 * - Content: TutorialDocument JSONB (blocks[])
 * - NO section_type, NO difficulty columns
 * - NO child tables
 * - NO legacy transformers
 */

import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import type { TutorialDocument } from '@quiz/types';
import { db } from '../db';
import { tutorialSections, type TutorialSection, type NewTutorialSection } from '../schema/tutorial-sections';
import { tutorialSubtopics } from '../schema/tutorial-subtopics';
import { tutorialContentVersions } from '../schema/tutorial-content-versions';
import { TutorialRepositoryBase } from './base.repository';
import type { TutorialDbClientLike } from '@quiz/types';

/**
 * V2 Tutorial filters for querying
 * Phase 1: Added navigationNodeId for page-specific queries
 */
export interface TutorialFilters {
  subtopicId?: string;
  navigationNodeId?: string; // Phase 1: Filter by specific navigation page
  brandId?: string;
  status?: string;
}

/**
 * Phase 1 Tutorial create input
 * Added navigationNodeId for sidebar page identity
 */
export interface CreateTutorialInput {
  subtopicId: string;
  navigationNodeId: string; // Phase 1: Required for new content (normalized sidebar node.id)
  brandId?: string;
  content: TutorialDocument;
  orderIndex?: number;
  promptTemplateId?: string;
  educationalArchitectureId?: string;
  uiArchitectureId?: string;
}

/**
 * V2 Tutorial update input
 */
export interface UpdateTutorialContentInput {
  content: TutorialDocument;
}

/**
 * V2 Tutorial status update input
 */
export interface UpdateTutorialStatusInput {
  status: 'draft' | 'generating' | 'validating' | 'pending_review' | 'in_review' | 'changes_requested' | 'approved' | 'deploying' | 'deployed' | 'archived';
  approvedBy?: string;
  rejectionReason?: string;
}

/**
 * Tutorial Section Repository - V2
 * Handles CRUD operations using V2 identity (subtopic_id, brand_id)
 */
export class TutorialSectionRepository extends TutorialRepositoryBase {
  /**
   * Create with different db client (for transactions)
   */
  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialSectionRepository(dbClient as typeof db) as this;
  }

  /**
   * Resolve external subtopic ID to internal tutorial_subtopics ID
   * External ID comes from main database, internal ID is used for FK
   */
  async resolveSubtopicId(externalSubtopicId: string): Promise<string | null> {
    const rows = await this.runRead(
      this.dbInstance
        .select({ id: tutorialSubtopics.id })
        .from(tutorialSubtopics)
        .where(eq(tutorialSubtopics.externalId, externalSubtopicId))
        .limit(1),
      'TutorialSectionRepository.resolveSubtopicId'
    );
    
    return rows[0]?.id ?? null;
  }

  /**
   * V2: Get tutorial by ID
   */
  async getTutorialById(tutorialId: string): Promise<TutorialSection | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'TutorialSectionRepository.getTutorialById'
    );

    return rows[0];
  }

  /**
   * Phase 1: Get tutorial by page identity (subtopicId, navigationNodeId, brandId)
   * Replaces V2 getTutorialBySubtopic which assumed one tutorial per subtopic
   * 
   * Phase 3: Brand resolution supports shared content fallback
   * - Prioritizes exact brand match
   * - Falls back to brand_id='shared' for multi-brand content
   */
  async getTutorialByPageIdentity(
    subtopicId: string,
    navigationNodeId: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            eq(tutorialSections.navigationNodeId, navigationNodeId),
            or(
              eq(tutorialSections.brandId, brandId as any),
              eq(tutorialSections.brandId, 'shared')
            ),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'TutorialSectionRepository.getTutorialByPageIdentity'
    );

    return rows[0];
  }

  /**
   * Phase 1: Get all pages for a subtopic (by navigationNodeId)
   * Returns array of tutorials for different sidebar pages under same subtopic
   */
  async getPagesBySubtopic(
    subtopicId: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection[]> {
    return await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            eq(tutorialSections.brandId, brandId as any),
            isNull(tutorialSections.deletedAt)
          )
        )
        .orderBy(tutorialSections.navigationNodeId, tutorialSections.orderIndex),
      'TutorialSectionRepository.getPagesBySubtopic'
    );
  }

  /**
   * V2: Get tutorial by V2 identity (subtopicId, brandId)
   * @deprecated Phase 1: Use getTutorialByPageIdentity instead
   * Kept for backward compatibility with existing content (navigationNodeId = NULL)
   */
  async getTutorialBySubtopic(
    subtopicId: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            eq(tutorialSections.brandId, brandId as any),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'TutorialSectionRepository.getTutorialBySubtopic'
    );

    return rows[0];
  }

  /**
   * V2: Get all tutorials for a subtopic (across brands)
   */
  async getTutorialsBySubtopic(subtopicId: string): Promise<TutorialSection[]> {
    return await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .orderBy(tutorialSections.brandId),
      'TutorialSectionRepository.getTutorialsBySubtopic'
    );
  }

  /**
   * V2: Get tutorials by brand with optional status filter
   */
  async getTutorialsByBrand(
    brandId: string,
    status?: string
  ): Promise<TutorialSection[]> {
    const conditions = [
      eq(tutorialSections.brandId, brandId as any),
      isNull(tutorialSections.deletedAt)
    ];

    if (status) {
      conditions.push(eq(tutorialSections.status, status as any));
    }

    return await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(and(...conditions))
        .orderBy(desc(tutorialSections.updatedAt)),
      'TutorialSectionRepository.getTutorialsByBrand'
    );
  }

  /**
   * V2: Query tutorials with filters
   */
  async queryTutorials(
    filters: TutorialFilters,
    limit: number = 20,
    cursor?: string
  ): Promise<{ tutorials: TutorialSection[]; hasMore: boolean; nextCursor: string | null }> {
    const conditions = [isNull(tutorialSections.deletedAt)];

    if (filters.subtopicId) {
      conditions.push(eq(tutorialSections.subtopicId, filters.subtopicId));
    }
    if (filters.navigationNodeId) {
      // Phase 1: Filter by specific navigation page
      conditions.push(eq(tutorialSections.navigationNodeId, filters.navigationNodeId));
    }
    if (filters.brandId) {
      conditions.push(eq(tutorialSections.brandId, filters.brandId as any));
    }
    if (filters.status) {
      conditions.push(eq(tutorialSections.status, filters.status as any));
    }
    if (cursor) {
      conditions.push(sql`${tutorialSections.createdAt} < (SELECT created_at FROM ${tutorialSections} WHERE id = ${cursor})`);
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(and(...conditions))
        .orderBy(desc(tutorialSections.createdAt))
        .limit(limit + 1),
      'TutorialSectionRepository.queryTutorials'
    );

    const hasMore = rows.length > limit;
    const tutorials = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? tutorials[tutorials.length - 1]?.id : null;

    return { tutorials, hasMore, nextCursor: nextCursor || null };
  }

  /**
   * V2: Count tutorials by filters
   */
  async countTutorials(filters: TutorialFilters): Promise<number> {
    const conditions = [isNull(tutorialSections.deletedAt)];

    if (filters.subtopicId) {
      conditions.push(eq(tutorialSections.subtopicId, filters.subtopicId));
    }
    if (filters.brandId) {
      conditions.push(eq(tutorialSections.brandId, filters.brandId as any));
    }
    if (filters.status) {
      conditions.push(eq(tutorialSections.status, filters.status as any));
    }

    const result = await this.runRead(
      this.dbInstance
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(tutorialSections)
        .where(and(...conditions)),
      'TutorialSectionRepository.countTutorials'
    );

    return result[0]?.count ?? 0;
  }

  /**
   * V2: Create new tutorial
   * Identity: (subtopicId, brandId) - enforced by database UNIQUE constraint
   */
  async createTutorial(input: CreateTutorialInput): Promise<TutorialSection> {
    const diagnosticId = `REPO-CREATE-${Date.now()}`;
    const now = new Date();

    console.log(`[${diagnosticId}] createTutorial - Starting:`, {
      subtopicId: input.subtopicId,
      brandId: input.brandId || 'shared',
      orderIndex: input.orderIndex,
      hasContent: !!input.content,
      contentBlocksCount: input.content?.blocks?.length,
    });

    const values: NewTutorialSection = {
      subtopicId: input.subtopicId,
      navigationNodeId: input.navigationNodeId, // Phase 1: Required for page identity
      brandId: (input.brandId || 'shared') as any,
      content: input.content as any, // TutorialDocument stored as JSONB
      orderIndex: input.orderIndex ?? 0,
      status: 'draft',
      version: 1,
      language: 'en',
      generatedByAi: false,
      regenerationCount: 0,
      promptTemplateId: input.promptTemplateId,
      educationalArchitectureId: input.educationalArchitectureId,
      uiArchitectureId: input.uiArchitectureId,
      createdAt: now,
      updatedAt: now,
    };

    console.log(`[${diagnosticId}] Executing INSERT with values:`, {
      subtopicId: values.subtopicId,
      navigationNodeId: values.navigationNodeId, // Phase 1
      brandId: values.brandId,
      orderIndex: values.orderIndex,
      status: values.status,
      version: values.version,
    });

    try {
      const [row] = await this.runRead(
        this.dbInstance
          .insert(tutorialSections)
          .values(values)
          .returning(),
        'TutorialSectionRepository.createTutorial'
      );

      console.log(`[${diagnosticId}] INSERT successful:`, {
        id: row.id,
        subtopicId: row.subtopicId,
        status: row.status,
      });

      return row;
    } catch (error) {
      console.error(`[${diagnosticId}] INSERT failed:`, {
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode: (error as any)?.code,
        errorDetail: (error as any)?.detail,
        errorConstraint: (error as any)?.constraint,
        errorTable: (error as any)?.table,
        errorColumn: (error as any)?.column,
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * V2: Update tutorial content (increments version)
   */
  async updateTutorialContent(
    tutorialId: string,
    input: UpdateTutorialContentInput
  ): Promise<TutorialSection | undefined> {
    const updateData: any = {
      content: input.content,
      updatedAt: new Date(),
      // Increment version when content changes
      version: sql`${tutorialSections.version} + 1`,
    };

    const [row] = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set(updateData)
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.updateTutorialContent'
    );

    return row;
  }

  /**
   * V2: Update tutorial content with optimistic concurrency control
   */
  async updateTutorialContentWithVersion(
    tutorialId: string,
    expectedVersion: number,
    input: UpdateTutorialContentInput
  ): Promise<TutorialSection | null> {
    const updateData: any = {
      content: input.content,
      updatedAt: new Date(),
      version: sql`${tutorialSections.version} + 1`,
    };

    const [row] = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set(updateData)
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            eq(tutorialSections.version, expectedVersion),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.updateTutorialContentWithVersion'
    );

    return row ?? null;
  }

  /**
   * V2: Update tutorial status
   */
  async updateTutorialStatus(
    tutorialId: string,
    input: UpdateTutorialStatusInput
  ): Promise<TutorialSection | undefined> {
    const updateData: any = {
      status: input.status,
      updatedAt: new Date(),
    };

    if (input.approvedBy) {
      updateData.approvedBy = input.approvedBy;
      updateData.approvedAt = new Date();
    }

    if (input.rejectionReason) {
      updateData.rejectionReason = input.rejectionReason;
    }

    if (input.status === 'deployed' && !updateData.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const [row] = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set(updateData)
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.updateTutorialStatus'
    );

    return row;
  }

  /**
   * V2: Publish tutorial (deploy status)
   */
  async publishTutorial(tutorialId: string): Promise<TutorialSection | undefined> {
    const now = new Date();

    const [row] = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          status: 'deployed',
          publishedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.publishTutorial'
    );

    return row;
  }

  /**
   * V2: Archive tutorial (soft delete)
   */
  async archiveTutorial(tutorialId: string): Promise<TutorialSection | undefined> {
    const now = new Date();

    const [row] = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          status: 'archived',
          deletedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.archiveTutorial'
    );

    return row;
  }

  /**
   * V2: Delete tutorial (soft delete)
   */
  async deleteTutorial(tutorialId: string): Promise<boolean> {
    const result = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tutorialSections.id, tutorialId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning({ id: tutorialSections.id }),
      'TutorialSectionRepository.deleteTutorial'
    );

    return result.length > 0;
  }
}

/**
 * Default repository instance
 */
export const tutorialSectionRepository = new TutorialSectionRepository();
