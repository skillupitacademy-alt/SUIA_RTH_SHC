/**
 * Layman Section Repository
 * Phase 2B - Backend Service Layer
 * ---------------------------------
 * Data access layer for Layman sections
 */

import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  tutorialSections,
  tutorialSubsections,
  promptTemplates,
  educationalArchitectures,
  uiArchitectures,
} from '../schema';
import { TutorialRepositoryBase } from './base.repository';
import type { TutorialDbClientLike } from '@quiz/types';
import type {
  LaymanSectionWithArchitectures,
  LaymanSectionQueryFilters,
  LaymanSectionCreateInput,
  LaymanSectionUpdateInput,
} from '../types/layman.types';

/**
 * Layman Repository
 * Handles all database operations for Layman sections
 */
export class LaymanRepository extends TutorialRepositoryBase {
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new LaymanRepository(dbClient as typeof db) as this;
  }

  /**
   * Get Layman section by subtopic ID
   */
  async getLaymanSectionBySubtopicId(
    subtopicId: string,
    brandId: 'shared' | 'realtutorialhub' | 'skillup'
  ): Promise<LaymanSectionWithArchitectures | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .leftJoin(
          educationalArchitectures,
          eq(tutorialSections.educationalArchitectureId, educationalArchitectures.id)
        )
        .leftJoin(uiArchitectures, eq(tutorialSections.uiArchitectureId, uiArchitectures.id))
        .where(
          and(
            eq(tutorialSections.subtopicId, subtopicId),
            eq(tutorialSections.sectionType, 'layman'),
            eq(tutorialSections.brandId, brandId),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'LaymanRepository.getLaymanSectionBySubtopicId'
    );

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      ...row.tutorial_sections,
      educationalArchitecture: row.educational_architectures || undefined,
      uiArchitecture: row.ui_architectures || undefined,
    } as LaymanSectionWithArchitectures;
  }

  /**
   * Get Layman section by ID
   */
  async getLaymanSectionById(sectionId: string): Promise<LaymanSectionWithArchitectures | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .leftJoin(
          educationalArchitectures,
          eq(tutorialSections.educationalArchitectureId, educationalArchitectures.id)
        )
        .leftJoin(uiArchitectures, eq(tutorialSections.uiArchitectureId, uiArchitectures.id))
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            eq(tutorialSections.sectionType, 'layman'),
            isNull(tutorialSections.deletedAt)
          )
        )
        .limit(1),
      'LaymanRepository.getLaymanSectionById'
    );

    if (rows.length === 0) return undefined;

    const row = rows[0];
    return {
      ...row.tutorial_sections,
      educationalArchitecture: row.educational_architectures || undefined,
      uiArchitecture: row.ui_architectures || undefined,
    } as LaymanSectionWithArchitectures;
  }

  /**
   * Query Layman sections with filters
   */
  async queryLaymanSections(
    filters: LaymanSectionQueryFilters
  ): Promise<LaymanSectionWithArchitectures[]> {
    const conditions = [eq(tutorialSections.sectionType, 'layman'), isNull(tutorialSections.deletedAt)];

    if (filters.subtopicId) {
      conditions.push(eq(tutorialSections.subtopicId, filters.subtopicId));
    }
    if (filters.brandId) {
      conditions.push(eq(tutorialSections.brandId, filters.brandId as any));
    }
    if (filters.status) {
      conditions.push(eq(tutorialSections.status, filters.status));
    }
    if (filters.educationalArchitectureId) {
      conditions.push(eq(tutorialSections.educationalArchitectureId, filters.educationalArchitectureId));
    }
    if (filters.uiArchitectureId) {
      conditions.push(eq(tutorialSections.uiArchitectureId, filters.uiArchitectureId));
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSections)
        .leftJoin(
          educationalArchitectures,
          eq(tutorialSections.educationalArchitectureId, educationalArchitectures.id)
        )
        .leftJoin(uiArchitectures, eq(tutorialSections.uiArchitectureId, uiArchitectures.id))
        .where(and(...conditions)),
      'LaymanRepository.queryLaymanSections'
    );

    return rows.map((row) => ({
      ...row.tutorial_sections,
      educationalArchitecture: row.educational_architectures || undefined,
      uiArchitecture: row.ui_architectures || undefined,
    })) as LaymanSectionWithArchitectures[];
  }

  /**
   * Get active prompt template
   */
  async getActivePromptTemplate(
    subsectionType: string,
    brandId: 'shared' | 'realtutorialhub' | 'skillup'
  ): Promise<typeof promptTemplates.$inferSelect | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(promptTemplates)
        .where(
          and(
            eq(promptTemplates.sectionType, 'layman'),
            eq(promptTemplates.subsectionType, subsectionType as any),
            eq(promptTemplates.brandId, brandId as any),
            eq(promptTemplates.isActive, true)
          )
        )
        .limit(1),
      'LaymanRepository.getActivePromptTemplate'
    );

    return rows[0];
  }

  /**
   * Get prompt template by name
   */
  async getPromptTemplateByName(
    name: string,
    brandId: 'shared' | 'realtutorialhub' | 'skillup'
  ): Promise<typeof promptTemplates.$inferSelect | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(promptTemplates)
        .where(
          and(
            eq(promptTemplates.name, name),
            eq(promptTemplates.sectionType, 'layman'),
            eq(promptTemplates.brandId, brandId as any),
            eq(promptTemplates.isActive, true)
          )
        )
        .limit(1),
      'LaymanRepository.getPromptTemplateByName'
    );

    return rows[0];
  }

  /**
   * Get educational architecture by name
   */
  async getEducationalArchitecture(
    name: string
  ): Promise<typeof educationalArchitectures.$inferSelect | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(educationalArchitectures)
        .where(and(eq(educationalArchitectures.name, name), eq(educationalArchitectures.isActive, true)))
        .limit(1),
      'LaymanRepository.getEducationalArchitecture'
    );

    return rows[0];
  }

  /**
   * Get UI architecture by name
   */
  async getUIArchitecture(name: string): Promise<typeof uiArchitectures.$inferSelect | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(uiArchitectures)
        .where(and(eq(uiArchitectures.name, name), eq(uiArchitectures.isActive, true)))
        .limit(1),
      'LaymanRepository.getUIArchitecture'
    );

    return rows[0];
  }

  /**
   * Create Layman section
   */
  async createLaymanSection(
    input: LaymanSectionCreateInput & {
      educationalArchitectureId: string;
      uiArchitectureId: string;
      difficulty?: 'simple' | 'mixed' | 'intermediate' | 'expert';
    }
  ): Promise<LaymanSectionWithArchitectures> {
    const [row] = await this.runRead(
      this.dbInstance
        .insert(tutorialSections)
        .values({
          subtopicId: input.subtopicId,
          sectionType: 'layman',
          difficulty: input.difficulty || 'simple',
          brandId: input.brandId as any,
          educationalArchitectureId: input.educationalArchitectureId,
          uiArchitectureId: input.uiArchitectureId,
          content: input.content || {},
          status: 'draft',
          version: 1,
          language: 'en',
          generatedByAi: false,
          regenerationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning(),
      'LaymanRepository.createLaymanSection'
    );

    // Fetch with architectures
    const section = await this.getLaymanSectionById(row.id);
    if (!section) {
      throw new Error('Failed to retrieve created section');
    }

    return section;
  }

  /**
   * Update Layman section
   */
  async updateLaymanSection(
    sectionId: string,
    updates: LaymanSectionUpdateInput
  ): Promise<LaymanSectionWithArchitectures | undefined> {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.content !== undefined) {
      updateData.content = updates.content;
      updateData.version = sql`${tutorialSections.version} + 1`;
    }
    if (updates.status !== undefined) {
      updateData.status = updates.status;
    }
    if (updates.educationalArchitectureId !== undefined) {
      updateData.educationalArchitectureId = updates.educationalArchitectureId;
    }
    if (updates.uiArchitectureId !== undefined) {
      updateData.uiArchitectureId = updates.uiArchitectureId;
    }
    if (updates.updatedBy !== undefined) {
      updateData.updatedBy = updates.updatedBy;
    }

    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set(updateData)
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            eq(tutorialSections.sectionType, 'layman'),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'LaymanRepository.updateLaymanSection'
    );

    if (rows.length === 0) return undefined;

    return this.getLaymanSectionById(sectionId);
  }

  /**
   * Publish Layman section
   */
  async publishLaymanSection(
    sectionId: string,
    publishedBy: string
  ): Promise<LaymanSectionWithArchitectures | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          status: 'deployed',
          publishedAt: new Date(),
          approvedBy: publishedBy,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            eq(tutorialSections.sectionType, 'layman'),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'LaymanRepository.publishLaymanSection'
    );

    if (rows.length === 0) return undefined;

    return this.getLaymanSectionById(sectionId);
  }

  /**
   * Archive Layman section (soft delete)
   */
  async archiveLaymanSection(
    sectionId: string,
    archivedBy: string
  ): Promise<LaymanSectionWithArchitectures | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialSections)
        .set({
          status: 'archived',
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tutorialSections.id, sectionId),
            eq(tutorialSections.sectionType, 'layman'),
            isNull(tutorialSections.deletedAt)
          )
        )
        .returning(),
      'LaymanRepository.archiveLaymanSection'
    );

    if (rows.length === 0) return undefined;

    // Return the archived section (without architecture joins since it's deleted)
    return rows[0] as LaymanSectionWithArchitectures;
  }

  /**
   * Get subsections for a section
   */
  async getSubsections(sectionId: string): Promise<typeof tutorialSubsections.$inferSelect[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialSubsections)
        .where(eq(tutorialSubsections.sectionId, sectionId)),
      'LaymanRepository.getSubsections'
    );

    return rows;
  }

  /**
   * Increment usage count for educational architecture
   */
  async incrementEducationalArchitectureUsage(architectureId: string): Promise<void> {
    await this.runRead(
      this.dbInstance
        .update(educationalArchitectures)
        .set({
          usageCount: sql`${educationalArchitectures.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(educationalArchitectures.id, architectureId)),
      'LaymanRepository.incrementEducationalArchitectureUsage'
    );
  }

  /**
   * Increment usage count for UI architecture
   */
  async incrementUIArchitectureUsage(architectureId: string): Promise<void> {
    await this.runRead(
      this.dbInstance
        .update(uiArchitectures)
        .set({
          usageCount: sql`${uiArchitectures.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(uiArchitectures.id, architectureId)),
      'LaymanRepository.incrementUIArchitectureUsage'
    );
  }

  /**
   * Increment usage count for prompt template
   */
  async incrementPromptTemplateUsage(templateId: string): Promise<void> {
    await this.runRead(
      this.dbInstance
        .update(promptTemplates)
        .set({
          usageCount: sql`${promptTemplates.usageCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(promptTemplates.id, templateId)),
      'LaymanRepository.incrementPromptTemplateUsage'
    );
  }
}
