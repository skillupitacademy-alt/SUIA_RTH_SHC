import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { assignmentHelpRequests } from '../schema/assignment-help-requests';
import { assignmentProgress } from '../schema/assignment-progress';
import { tutorialAssignments } from '../schema/tutorial-assignments';

import type {
  AssignmentDifficulty,
  AssignmentHelpRequestCreateInput,
  AssignmentHelpRequestRecord,
  AssignmentHelpRequestStatus,
  AssignmentHelpRequestUpdateInput,
  AssignmentProgressRecord,
  AssignmentProgressStatus,
  AssignmentRecord,
  AssignmentTierStatusMap,
  IAssignmentRepository,
  TutorialDbClientLike,
} from '@quiz/types';

import { TutorialRepositoryBase } from './base.repository';

const activeAssignments = isNull(tutorialAssignments.deletedAt);
const activeProgress = isNull(assignmentProgress.deletedAt);
const activeHelpRequests = isNull(assignmentHelpRequests.deletedAt);

const createEmptyTierStatus = (): AssignmentTierStatusMap => ({
  simple: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
  mixed: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
  intermediate: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
  expert: { status: 'not_started', isUnlocked: false, startedAt: null, completedAt: null },
});

export class AssignmentRepository extends TutorialRepositoryBase implements IAssignmentRepository {
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new AssignmentRepository(dbClient as typeof db) as this;
  }

  async getAssignments(subtopicId: string, difficulty: AssignmentDifficulty): Promise<AssignmentRecord[]> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(tutorialAssignments)
        .where(and(eq(tutorialAssignments.subtopicId, subtopicId), eq(tutorialAssignments.difficulty, difficulty), activeAssignments)),
      'AssignmentRepository.getAssignments'
    );

    return rows as AssignmentRecord[];
  }

  async getProgress(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty
  ): Promise<AssignmentProgressRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(assignmentProgress)
        .where(
          and(
            eq(assignmentProgress.userId, userId),
            eq(assignmentProgress.subtopicId, subtopicId),
            eq(assignmentProgress.difficulty, difficulty),
            activeProgress
          )
        ),
      'AssignmentRepository.getProgress'
    );

    return rows[0] as AssignmentProgressRecord | undefined;
  }

  async upsertProgress(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty,
    status: AssignmentProgressStatus
  ): Promise<AssignmentProgressRecord> {
    const existing = await this.getProgress(userId, subtopicId, difficulty);
    const now = new Date();

    if (existing === undefined) {
      const [row] = (await this.runRead(
        this.dbInstance
          .insert(assignmentProgress)
          .values({
            userId,
            subtopicId,
            difficulty,
            status,
            startedAt: status === 'not_started' ? null : now,
            completedAt: status === 'self_completed' ? now : null,
            version: 1,
            deletedAt: null,
          })
          .returning(),
        'AssignmentRepository.upsertProgress.insert'
      )) as AssignmentProgressRecord[];

      return row;
    }

    const [row] = (await this.runRead(
      this.dbInstance
        .update(assignmentProgress)
        .set({
          status,
          startedAt: existing.startedAt ?? (status === 'not_started' ? null : now),
          completedAt: status === 'self_completed' ? (existing.completedAt ?? now) : existing.completedAt,
          version: sql`${assignmentProgress.version} + 1`,
          updatedAt: now,
          deletedAt: null,
        })
        .where(
          and(
            eq(assignmentProgress.id, existing.id),
            activeProgress
          )
        )
        .returning(),
      'AssignmentRepository.upsertProgress.update'
    )) as AssignmentProgressRecord[];

    return row;
  }

  async getTierStatus(userId: string, subtopicId: string): Promise<AssignmentTierStatusMap> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(assignmentProgress)
        .where(
          and(
            eq(assignmentProgress.userId, userId),
            eq(assignmentProgress.subtopicId, subtopicId),
            activeProgress
          )
        ),
      'AssignmentRepository.getTierStatus'
    );

    const status = createEmptyTierStatus();
    for (const row of rows as AssignmentProgressRecord[]) {
      status[row.difficulty] = {
        status: row.status,
        isUnlocked: row.status !== 'not_started',
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      };
    }

    status.simple.isUnlocked = rows.length > 0 ? status.simple.status !== 'not_started' : false;
    status.mixed.isUnlocked = status.simple.completedAt !== null || status.simple.status === 'self_completed';
    status.intermediate.isUnlocked = status.mixed.status === 'self_completed';
    status.expert.isUnlocked = status.intermediate.status === 'self_completed';

    return status;
  }

  async createHelpRequest(data: AssignmentHelpRequestCreateInput): Promise<AssignmentHelpRequestRecord> {
    const now = new Date();
    const [row] = (await this.runRead(
      this.dbInstance
        .insert(assignmentHelpRequests)
        .values({
          userId: data.userId,
          subtopicId: data.subtopicId,
          assignmentId: data.assignmentId,
          question: data.question,
          status: data.status ?? 'open',
          assignedTo: data.assignedTo ?? null,
          resolvedAt: data.resolvedAt ?? null,
          version: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })
        .returning(),
      'AssignmentRepository.createHelpRequest'
    )) as AssignmentHelpRequestRecord[];

    return row;
  }

  async getHelpRequests(filters: {
    status?: AssignmentHelpRequestStatus;
    assignedTo?: string;
    subtopicId?: string;
  }): Promise<AssignmentHelpRequestRecord[]> {
    const conditions = [activeHelpRequests];
    if (filters.status !== undefined) {
      conditions.push(eq(assignmentHelpRequests.status, filters.status));
    }
    if (filters.assignedTo !== undefined) {
      conditions.push(eq(assignmentHelpRequests.assignedTo, filters.assignedTo));
    }
    if (filters.subtopicId !== undefined) {
      conditions.push(eq(assignmentHelpRequests.subtopicId, filters.subtopicId));
    }

    const rows = await this.runReport(
      this.dbInstance
        .select()
        .from(assignmentHelpRequests)
        .where(and(...conditions)),
      'AssignmentRepository.getHelpRequests'
    );

    return rows as AssignmentHelpRequestRecord[];
  }

  async updateHelpRequest(
    id: string,
    data: AssignmentHelpRequestUpdateInput
  ): Promise<AssignmentHelpRequestRecord | undefined> {
    const now = new Date();
    const rows = await this.runRead(
      this.dbInstance
        .update(assignmentHelpRequests)
        .set({
          status: data.status,
          assignedTo: data.assignedTo,
          resolvedAt: data.resolvedAt,
          updatedAt: now,
          version: sql`${assignmentHelpRequests.version} + 1`,
          deletedAt: null,
        })
        .where(and(eq(assignmentHelpRequests.id, id), activeHelpRequests))
        .returning(),
      'AssignmentRepository.updateHelpRequest'
    );

    return rows[0] as AssignmentHelpRequestRecord | undefined;
  }
}
