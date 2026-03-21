import { and, eq, isNull, sql } from 'drizzle-orm';

import { tutorialContent } from '../schema/tutorial-content';
import { db } from '../db';

import type {
  ITutorialContentRepository,
  TutorialDbClientLike,
  TutorialContentRecord,
  TutorialContentUpsertInput,
  TutorialDifficulty,
} from '@quiz/types';
import { TutorialContentSchema } from '@quiz/types';

import { TutorialRepositoryBase } from './base.repository';

const activeContent = isNull(tutorialContent.deletedAt);

export class TutorialContentRepository
  extends TutorialRepositoryBase
  implements ITutorialContentRepository
{
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new TutorialContentRepository(dbClient as typeof db) as this;
  }

  async findById(id: string): Promise<TutorialContentRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialContent)
        .where(and(eq(tutorialContent.id, id), activeContent)),
      'TutorialContentRepository.findById'
    );

    return rows[0] as TutorialContentRecord | undefined;
  }

  async findBySubtopicId(
    subtopicId: string,
    difficulty?: TutorialDifficulty
  ): Promise<TutorialContentRecord[]> {
    const conditions = [eq(tutorialContent.subtopicId, subtopicId), activeContent];
    if (difficulty) {
      conditions.push(eq(tutorialContent.difficulty, difficulty));
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialContent)
        .where(and(...conditions)),
      'TutorialContentRepository.findBySubtopicId'
    );

    return rows as TutorialContentRecord[];
  }

  async getPublished(
    subtopicId: string,
    difficulty?: TutorialDifficulty
  ): Promise<TutorialContentRecord[]> {
    const conditions = [
      eq(tutorialContent.subtopicId, subtopicId),
      eq(tutorialContent.isPublished, true),
      activeContent,
    ];
    if (difficulty) {
      conditions.push(eq(tutorialContent.difficulty, difficulty));
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialContent)
        .where(and(...conditions)),
      'TutorialContentRepository.getPublished'
    );

    return rows as TutorialContentRecord[];
  }

  async upsertBlocks(data: TutorialContentUpsertInput): Promise<TutorialContentRecord> {
    const validatedContent = TutorialContentSchema.parse(data.content);
    const [row] = (await this.runRead(
      this.dbInstance
        .insert(tutorialContent)
        .values({
          subtopicId: data.subtopicId,
          difficulty: data.difficulty,
          contentType: 'standard',
          content: validatedContent,
          version: 1,
          language: data.language ?? 'en',
          isPublished: data.isPublished ?? false,
          generatedByAi: data.generatedByAi ?? false,
          aiModelUsed: data.aiModelUsed ?? null,
          generationJobId: data.generationJobId ?? null,
          adminApprovedBy: data.adminApprovedBy ?? null,
          adminApprovedAt: data.adminApprovedAt ?? null,
          qualityScore: data.qualityScore ?? null,
          regenerationCount: 0,
          deletedAt: null,
        })
        .onConflictDoUpdate({
          target: [tutorialContent.subtopicId, tutorialContent.difficulty, tutorialContent.contentType],
          set: {
            content: validatedContent,
            contentType: 'standard',
            language: data.language ?? 'en',
            isPublished: data.isPublished ?? false,
            generatedByAi: data.generatedByAi ?? false,
            aiModelUsed: data.aiModelUsed ?? null,
            generationJobId: data.generationJobId ?? null,
            adminApprovedBy: data.adminApprovedBy ?? null,
            adminApprovedAt: data.adminApprovedAt ?? null,
            qualityScore: data.qualityScore ?? null,
            version: sql`${tutorialContent.version} + 1`,
            regenerationCount: sql`${tutorialContent.regenerationCount} + 1`,
            updatedAt: new Date(),
            deletedAt: null,
          },
        })
        .returning(),
      'TutorialContentRepository.upsertBlocks'
    )) as TutorialContentRecord[];

    return row;
  }

  async publish(contentId: string): Promise<TutorialContentRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialContent)
        .set({
          isPublished: true,
          deletedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(tutorialContent.id, contentId), activeContent))
        .returning(),
      'TutorialContentRepository.publish'
    );

    return rows[0] as TutorialContentRecord | undefined;
  }

  async getVersionHistory(contentId: string): Promise<TutorialContentRecord[]> {
    const rows = await this.runReport(
      this.dbInstance
        .select()
        .from(tutorialContent)
        .where(eq(tutorialContent.id, contentId)),
      'TutorialContentRepository.getVersionHistory'
    );

    return rows as TutorialContentRecord[];
  }

  async softDelete(contentId: string): Promise<TutorialContentRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .update(tutorialContent)
        .set({
          deletedAt: new Date(),
          isPublished: false,
          updatedAt: new Date(),
        })
        .where(and(eq(tutorialContent.id, contentId), activeContent))
        .returning(),
      'TutorialContentRepository.softDelete'
    );

    return rows[0] as TutorialContentRecord | undefined;
  }
}
