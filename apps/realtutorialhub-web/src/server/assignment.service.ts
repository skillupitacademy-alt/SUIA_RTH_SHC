import { db, AssignmentRepository, TutorialProgressRepository } from '@quiz/db-tutorial';
import { publishEvent } from '@quiz/events';
import type {
  AssignmentDifficulty,
  AssignmentHelpRequestRecord,
  AssignmentRecord,
  AssignmentTierStatusMap,
} from '@quiz/types';

import { AssignmentTierAlreadyCompletedError, AssignmentTierLockedError } from '@quiz/types';

const DIFFICULTY_ORDER: AssignmentDifficulty[] = ['simple', 'mixed', 'intermediate', 'expert'];

export interface AssignmentServiceDependencies {
  assignmentRepository?: AssignmentRepository;
  progressRepository?: TutorialProgressRepository;
}

export interface AssignmentUnlockResult {
  locked: boolean;
  requiredTier?: AssignmentDifficulty | 'content_flow';
  assignments?: AssignmentRecord[];
  progress?: Awaited<ReturnType<AssignmentRepository['getProgress']>> | undefined;
  tierStatus?: AssignmentTierStatusMap;
}

export class AssignmentService {
  private readonly assignmentRepository: AssignmentRepository;
  private readonly progressRepository: TutorialProgressRepository;

  constructor(dependencies: AssignmentServiceDependencies = {}) {
    this.assignmentRepository = dependencies.assignmentRepository ?? new AssignmentRepository();
    this.progressRepository = dependencies.progressRepository ?? new TutorialProgressRepository();
  }

  private getPreviousTier(difficulty: AssignmentDifficulty): AssignmentDifficulty | null {
    const index = DIFFICULTY_ORDER.indexOf(difficulty);
    if (index <= 0) return null;
    return DIFFICULTY_ORDER[index - 1] ?? null;
  }

  private async isContentFlowComplete(userId: string, subtopicId: string): Promise<boolean> {
    return this.progressRepository.isSubtopicComplete(userId, subtopicId);
  }

  async getTierStatus(userId: string, subtopicId: string): Promise<AssignmentTierStatusMap> {
    const status = await this.assignmentRepository.getTierStatus(userId, subtopicId);
    const contentComplete = await this.isContentFlowComplete(userId, subtopicId);

    status.simple.isUnlocked = contentComplete;
    status.mixed.isUnlocked = status.simple.status === 'self_completed';
    status.intermediate.isUnlocked = status.mixed.status === 'self_completed';
    status.expert.isUnlocked = status.intermediate.status === 'self_completed';

    return status;
  }

  async getAssignmentsForSubtopic(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty
  ): Promise<AssignmentUnlockResult> {
    const tierStatus = await this.getTierStatus(userId, subtopicId);

    if (difficulty === 'simple') {
      if (!tierStatus.simple.isUnlocked) {
        return { locked: true, requiredTier: 'content_flow', tierStatus };
      }
    } else {
      const previousTier = this.getPreviousTier(difficulty);
      if (previousTier !== null && tierStatus[previousTier].status !== 'self_completed') {
        return { locked: true, requiredTier: previousTier, tierStatus };
      }
    }

    const assignments = await this.assignmentRepository.getAssignments(subtopicId, difficulty);
    const progress = await this.assignmentRepository.getProgress(userId, subtopicId, difficulty);
    return { locked: false, assignments, progress, tierStatus };
  }

  async startTier(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty
  ) {
    if (difficulty === 'simple') {
      const contentComplete = await this.isContentFlowComplete(userId, subtopicId);
      if (!contentComplete) {
        throw new AssignmentTierLockedError(difficulty, 'content_flow');
      }
    } else {
      const previousTier = this.getPreviousTier(difficulty);
      if (previousTier === null) {
        throw new AssignmentTierLockedError(difficulty, 'simple');
      }

      const tierStatus = await this.getTierStatus(userId, subtopicId);
      if (tierStatus[previousTier].status !== 'self_completed') {
        throw new AssignmentTierLockedError(difficulty, previousTier);
      }
    }

    const current = await this.assignmentRepository.getProgress(userId, subtopicId, difficulty);
    if (current?.status === 'self_completed') {
      throw new AssignmentTierAlreadyCompletedError(difficulty);
    }

    return db.transaction(async (tx) => {
      const txRepo = this.assignmentRepository.withDb(tx as never);
      return txRepo.upsertProgress(userId, subtopicId, difficulty, 'in_progress');
    });
  }

  async completeTier(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty
  ) {
    const current = await this.assignmentRepository.getProgress(userId, subtopicId, difficulty);
    if (current?.status === 'self_completed') {
      throw new AssignmentTierAlreadyCompletedError(difficulty);
    }

    const nextUnlockedTier = DIFFICULTY_ORDER[DIFFICULTY_ORDER.indexOf(difficulty) + 1] ?? null;

    const progress = await db.transaction(async (tx) => {
      const txRepo = this.assignmentRepository.withDb(tx as never);
      return txRepo.upsertProgress(userId, subtopicId, difficulty, 'self_completed');
    });

    return {
      progress,
      nextUnlockedTier,
    };
  }

  async submitHelpRequest(
    userId: string,
    subtopicId: string,
    assignmentId: string,
    question: string
  ): Promise<AssignmentHelpRequestRecord> {
    const assignments = DIFFICULTY_ORDER.flatMap((difficulty) => this.assignmentRepository.getAssignments(subtopicId, difficulty));
    const resolvedAssignments = await Promise.all(assignments);
    const matches = resolvedAssignments.flat().find((assignment) => assignment.id === assignmentId);

    if (matches === undefined) {
      throw new Error('Assignment does not belong to the requested subtopic');
    }

    const helpRequest = await this.assignmentRepository.createHelpRequest({
      userId,
      subtopicId,
      assignmentId,
      question,
      status: 'open',
    });

    void publishEvent('assignment.help_requested' as never, {
      userId,
      subtopicId,
      assignmentId,
      question,
    } as never, {
      destinationUrl: process.env.TUTORIAL_HELP_REQUEST_TOPIC_URL ?? 'https://placeholder.invalid/tutorial/help-request',
    }).catch(() => undefined);

    return helpRequest;
  }
}
