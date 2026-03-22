import type { ContentBlockType, TutorialContentJSON } from './tutorial-content.types';

export type TutorialDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';
export type TutorialProjectLevel = 'simple' | 'intermediate' | 'expert';
export type TutorialProjectSubmissionStatus =
  | 'pending'
  | 'submitted'
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
  videoRequired?: boolean;
  videoUrl?: string | null;
  submittedAt?: Date | null;
  gradedAt?: Date | null;
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
