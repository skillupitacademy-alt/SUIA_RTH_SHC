import type { ContentBlockType, TutorialContentJSON } from './tutorial-content.types';
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
} from './assignment.types';
import type {
  ProjectBadgeAwardRecord,
  ProjectRecord,
  ProjectScope,
  ProjectSubmissionCreateInput,
  ProjectSubmissionRecord,
  ProjectSubmissionStatus,
} from './project.types';

export type TutorialDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';
export type TutorialProjectLevel = 'simple' | 'intermediate' | 'expert';
export type TutorialProjectSubmissionStatus =
  | 'pending'
  | 'submitted'
  | 'ai_reviewing'
  | 'needs_review'
  | 'approved'
  | 'revision_needed'
  | 'graded'
  | 'revision-requested';

export interface TutorialDbClientLike {
  select: () => unknown;
  insert: (table: unknown) => unknown;
  update: (table: unknown) => unknown;
  delete: (table: unknown) => unknown;
  query?: Record<string, unknown>;
}

export interface TutorialContentRecord {
  id: string;
  subtopicId: string;
  difficulty: TutorialDifficulty;
  contentType: string;
  content: TutorialContentJSON;
  version: number;
  language: string;
  isPublished: boolean;
  generatedByAi: boolean;
  aiModelUsed: string | null;
  generationJobId: string | null;
  adminApprovedBy: string | null;
  adminApprovedAt: Date | null;
  qualityScore: Record<string, unknown> | null;
  regenerationCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TutorialContentUpsertInput {
  subtopicId: string;
  difficulty: TutorialDifficulty;
  content: TutorialContentJSON;
  language?: string;
  isPublished?: boolean;
  generatedByAi?: boolean;
  aiModelUsed?: string | null;
  generationJobId?: string | null;
  adminApprovedBy?: string | null;
  adminApprovedAt?: Date | null;
  qualityScore?: Record<string, unknown> | null;
}

export interface TutorialProgressRecord {
  id: string;
  userId: string;
  subtopicId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  blocksCompleted: ContentBlockType[];
  remediationTriggered: boolean;
  score: string | null;
  timeSpentSec: number;
  completedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TutorialProjectSubmissionRecord {
  id: string;
  userId: string;
  projectId: string;
  projectLevel: TutorialProjectLevel;
  difficulty: TutorialDifficulty;
  submissionContent: Record<string, unknown>;
  status: TutorialProjectSubmissionStatus;
  score: number | null;
  feedback: string | null;
  aiReview: Record<string, unknown> | null;
  peerReviews: Record<string, unknown>[];
  adminReview: Record<string, unknown> | null;
  badgeAwarded: boolean;
  videoRequired: boolean;
  videoUrl: string | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface TutorialProjectSubmissionCreateInput {
  userId: string;
  projectId: string;
  projectLevel: TutorialProjectLevel;
  difficulty: TutorialDifficulty;
  submissionContent: Record<string, unknown>;
  status?: TutorialProjectSubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  aiReview?: Record<string, unknown> | null;
  peerReviews?: Record<string, unknown>[];
  adminReview?: Record<string, unknown> | null;
  badgeAwarded?: boolean;
  videoRequired?: boolean;
  videoUrl?: string | null;
  submittedAt?: Date | null;
  gradedAt?: Date | null;
}

export interface IProjectRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  getProject(projectId: string): Promise<ProjectRecord | undefined>;
  getSubmission(submissionId: string): Promise<ProjectSubmissionRecord | undefined>;
  getSubmissionsByUser(userId: string): Promise<ProjectSubmissionRecord[]>;
  createSubmission(data: ProjectSubmissionCreateInput): Promise<ProjectSubmissionRecord>;
  updateSubmissionStatus(
    submissionId: string,
    status: ProjectSubmissionStatus,
    reviewData?: Record<string, unknown> | null
  ): Promise<ProjectSubmissionRecord | undefined>;
  awardBadge(userId: string, badgeId: string, submissionId: string): Promise<ProjectBadgeAwardRecord>;
  getBadgesByUser(userId: string): Promise<ProjectBadgeAwardRecord[]>;
  getProjectsByScope(scope: ProjectScope, parentId: string): Promise<ProjectRecord[]>;
}

export interface ITutorialContentRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  findById(id: string): Promise<TutorialContentRecord | undefined>;
  findBySubtopicId(
    subtopicId: string,
    difficulty?: TutorialDifficulty
  ): Promise<TutorialContentRecord[]>;
  getPublished(
    subtopicId: string,
    difficulty?: TutorialDifficulty
  ): Promise<TutorialContentRecord[]>;
  upsertBlocks(data: TutorialContentUpsertInput): Promise<TutorialContentRecord>;
  updateById(
    contentId: string,
    data: TutorialContentUpsertInput
  ): Promise<TutorialContentRecord | undefined>;
  publish(contentId: string): Promise<TutorialContentRecord | undefined>;
  getVersionHistory(contentId: string): Promise<TutorialContentRecord[]>;
  softDelete(contentId: string): Promise<TutorialContentRecord | undefined>;
}

export interface ITutorialProgressRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  findById(id: string): Promise<TutorialProgressRecord | undefined>;
  getProgress(userId: string, subtopicId: string): Promise<TutorialProgressRecord | undefined>;
  markBlockComplete(
    userId: string,
    subtopicId: string,
    blockType: ContentBlockType
  ): Promise<TutorialProgressRecord>;
  isSubtopicComplete(userId: string, subtopicId: string): Promise<boolean>;
  getCompletedSubtopics(userId: string): Promise<string[]>;
  resetProgress(userId: string, subtopicId: string): Promise<TutorialProgressRecord>;
}

export interface IProjectSubmissionRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  findById(id: string): Promise<TutorialProjectSubmissionRecord | undefined>;
  submit(data: TutorialProjectSubmissionCreateInput): Promise<TutorialProjectSubmissionRecord>;
  grade(
    submissionId: string,
    score: number,
    feedback: string
  ): Promise<TutorialProjectSubmissionRecord | undefined>;
  getPending(projectId?: string): Promise<TutorialProjectSubmissionRecord[]>;
  getByUser(
    userId: string,
    level?: TutorialProjectLevel
  ): Promise<TutorialProjectSubmissionRecord[]>;
  requiresVideo(projectId: string, difficulty: TutorialDifficulty): Promise<boolean>;
  softDelete(id: string): Promise<TutorialProjectSubmissionRecord | undefined>;
}

export interface IAssignmentRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  getAssignments(subtopicId: string, difficulty: AssignmentDifficulty): Promise<AssignmentRecord[]>;
  getProgress(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty
  ): Promise<AssignmentProgressRecord | undefined>;
  upsertProgress(
    userId: string,
    subtopicId: string,
    difficulty: AssignmentDifficulty,
    status: AssignmentProgressStatus
  ): Promise<AssignmentProgressRecord>;
  getTierStatus(userId: string, subtopicId: string): Promise<AssignmentTierStatusMap>;
  createHelpRequest(data: AssignmentHelpRequestCreateInput): Promise<AssignmentHelpRequestRecord>;
  getHelpRequests(filters: {
    status?: AssignmentHelpRequestStatus;
    assignedTo?: string;
    subtopicId?: string;
  }): Promise<AssignmentHelpRequestRecord[]>;
  updateHelpRequest(
    id: string,
    data: AssignmentHelpRequestUpdateInput
  ): Promise<AssignmentHelpRequestRecord | undefined>;
}
