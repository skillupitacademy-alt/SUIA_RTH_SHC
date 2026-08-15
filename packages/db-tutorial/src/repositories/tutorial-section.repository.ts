/**
 * Tutorial Section Repository
 * Data access layer for tutorial_sections table
 * 
 * ARCHITECTURE:
 * - Reads/writes ONLY tutorial_sections table
 * - NO child table dependencies (tutorial_section_*)
 * - NO legacy transformers
 * - Content stored as TutorialDocument in JSONB
 */

import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import type { TutorialDocument } from '@quiz/types';
import { db } from '../db';
import { tutorialSections, type TutorialSection, type NewTutorialSection } from '../schema/tutorial-sections';
import { TutorialRepositoryBase } from './base.repository';
import type { TutorialDbClientLike } from '@quiz/types';

/**
 * Section filters for querying
 */
export interface TutorialSectionFilters {
  subtopicId?: string;
  sectionType?: string;
  difficulty?: string;
  status?: string;
  brandId?: string;
}

/**
 * Section create input
 */
export interface CreateTutorialSectionInput {
  subtopicId: string;
  sectionType: string;
  difficulty: string;
  content: TutorialDocument;
  brandId?: string;
  orderIndex?: number;
}

/**
 * Section update input
 */
export interface UpdateTutorialSectionInput {
  content?: TutorialDocument;
  difficulty?: string;
  orderIndex?: number;
  status?: string;
}

/**
 * Tutorial Section Repository
 * Handles CRUD operations for tutorial_sections
 */
export class TutorialSectionRepository extends TutorialRepositoryBase {
  /**
   * Create with different db client (for transactions)
   */
  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialSectionRepository(dbClient as typeof db) as this;
  }

  /**
   * Get section by ID
   */
  async getSectionById(sectionId: string): Promise<TutorialSection | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'TutorialSectionRepository.getSectionById'
    );

    return rows[0];
  }

  /**
   * Get section by subtopic, type, difficulty, and brand
   */
  async getSectionByKey(
    subtopicId: string,
    sectionType: string,
    difficulty: string,
    brandId: string = 'shared'
  ): Promise<TutorialSection | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            eq(tutorialSections.sectionType, sectionType as any),
            eq(tutorialSections.difficulty, difficulty as any),
            eq(tutorialSections.brandId, brandId as any),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'TutorialSectionRepository.getSectionByKey'
    );

    return rows[0];
  }

  /**
   * Query sections with filters
   */
  async querySections(
    filters: TutorialSectionFilters,
    limit: number = 20,
    cursor?: string
  ): Promise<{ sections: TutorialSection[]; hasMore: boolean; nextCursor: string | null }> {
    const conditions = [isNull(tutorialSections.deletedAt)];

    if (filters.subtopicId) {
      conditions.push(eq(tutorialSections.subtopicId, filters.subtopicId));
    }
    if (filters.sectionType) {
      conditions.push(eq(tutorialSections.sectionType, filters.sectionType as any));
    }
    if (filters.difficulty) {
      conditions.push(eq(tutorialSections.difficulty, filters.difficulty as any));
    }
    if (filters.status) {
      conditions.push(eq(tutorialSections.status, filters.status as any));
    }
    if (filters.brandId) {
      conditions.push(eq(tutorialSections.brandId, filters.brandId as any));
    }
    if (cursor) {
      // Cursor-based pagination (assumes cursor is section ID)
      // In a real implementation, this would use a more sophisticated cursor
      conditions.push(sql`${tutorialSections.createdAt} < (SELECT created_at FROM ${tutorialSections} WHERE id = ${cursor})`);
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .where(and(...conditions))
        .orderBy(desc(tutorialSections.createdAt))
        .limit(limit + 1),
      'TutorialSectionRepository.querySections'
    );

    const hasMore = rows.length > limit;
    const sections = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? sections[sections.length - 1]?.id : null;

    return { sections, hasMore, nextCursor: nextCursor || null };
  }

  /**
   * Create new section
   * CRITICAL: Only writes to tutorial_sections, NOT child tables
   */
  async createSection(input: CreateTutorialSectionInput): Promise<TutorialSection> {
    const now = new Date();

    const values: NewTutorialSection = {
      subtopicId: input.subtopicId,
      sectionType: input.sectionType as any,
      difficulty: input.difficulty as any,
      content: input.content as any, // TutorialDocument stored as JSONB
      brandId: (input.brandId || 'shared') as any,
      orderIndex: input.orderIndex ?? 0,
      status: 'draft',
      version: 1,
      language: 'en',
      generatedByAi: false,
      regenerationCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const [row] = await this.runRead(
      this.dbInstance
        .insert(tutorialSections)
        .values(values)
        .returning(),
      'TutorialSectionRepository.createSection'
    );

    return row;
  }

  /**
   * Update section
   * CRITICAL: Only updates tutorial_sections, NOT child tables
   */
  async updateSection(
    sectionId: string,
    input: UpdateTutorialSectionInput
  ): Promise<TutorialSection | undefined> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (input.content !== undefined) {
      updateData.content = input.content;
      // Increment version when content changes
      updateData.version = sql`${tutorialSections.version} + 1`;
    }

    if (input.difficulty !== undefined) {
      updateData.difficulty = input.difficulty;
    }

    if (input.orderIndex !== undefined) {
      updateData.orderIndex = input.orderIndex;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
      
      // Set publishedAt when deploying
      if (input.status === 'deployed' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set(updateData)
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.updateSection'
    );

    return rows[0];
  }

  /**
   * Publish section (change status to deployed)
   */
  async publishSection(sectionId: string): Promise<TutorialSection | undefined> {
    const now = new Date();

    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          status: 'deployed',
          publishedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.publishSection'
    );

    return rows[0];
  }

  /**
   * Archive section (soft delete)
   */
  async archiveSection(sectionId: string): Promise<TutorialSection | undefined> {
    const now = new Date();

    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          status: 'archived',
          deletedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'TutorialSectionRepository.archiveSection'
    );

    return rows[0];
  }

  /**
   * Count sections by filters
   */
  async countSections(filters: TutorialSectionFilters): Promise<number> {
    const conditions = [isNull(tutorialSections.deletedAt)];

    if (filters.subtopicId) {
      conditions.push(eq(tutorialSections.subtopicId, filters.subtopicId));
    }
    if (filters.sectionType) {
      conditions.push(eq(tutorialSections.sectionType, filters.sectionType as any));
    }
    if (filters.difficulty) {
      conditions.push(eq(tutorialSections.difficulty, filters.difficulty as any));
    }
    if (filters.status) {
      conditions.push(eq(tutorialSections.status, filters.status as any));
    }
    if (filters.brandId) {
      conditions.push(eq(tutorialSections.brandId, filters.brandId as any));
    }

    const result = await this.runRead(
      this.dbInstance
        .select({ count: sql<number>`cast(count(*) as integer)` })
        .from(tutorialSections)
        .where(and(...conditions)),
      'TutorialSectionRepository.countSections'
    );

    return result[0]?.count ?? 0;
  }
}

/**
 * Default repository instance
 */
export const tutorialSectionRepository = new TutorialSectionRepository();
