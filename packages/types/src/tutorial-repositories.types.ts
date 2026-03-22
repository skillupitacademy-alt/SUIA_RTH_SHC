import type {
  ContentBlockType,
  TutorialContentAuditCreateInput,
  TutorialContentAuditRecord,
  TutorialContentJSON,
  TutorialContentVersionCreateInput,
  TutorialContentVersionRecord,
} from './tutorial-content.types';
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
  LiveSessionRequestCreateInput,
  LiveSessionRequestFilters,
  LiveSessionRequestRecord,
  LiveSessionRequestStatus,
  LiveSessionRequestUpdateInput,
} from './live-session.types';
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
  createVersionSnapshot(input: TutorialContentVersionCreateInput): Promise<TutorialContentVersionRecord>;
  getVersionSnapshot(versionId: string): Promise<TutorialContentVersionRecord | undefined>;
  getVersionSnapshots(contentId: string): Promise<TutorialContentVersionRecord[]>;
  createAuditEntry(input: TutorialContentAuditCreateInput): Promise<TutorialContentAuditRecord>;
  getAuditEntries(filters: {
    contentId?: string;
    action?: TutorialContentAuditRecord['action'];
    limit?: number;
    offset?: number;
  }): Promise<TutorialContentAuditRecord[]>;
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

export interface ILiveSessionRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  createRequest(studentId: string, subtopicId: string, doubtText?: string | null): Promise<LiveSessionRequestRecord>;
  getRequest(id: string): Promise<LiveSessionRequestRecord | undefined>;
  getRequestsByStudent(studentId: string, status?: LiveSessionRequestStatus): Promise<LiveSessionRequestRecord[]>;
  getRequestsByFaculty(facultyId: string, status?: LiveSessionRequestStatus): Promise<LiveSessionRequestRecord[]>;
  getPendingRequests(filters?: LiveSessionRequestFilters): Promise<LiveSessionRequestRecord[]>;
  acceptRequest(id: string, facultyId: string): Promise<LiveSessionRequestRecord>;
  scheduleRequest(id: string, scheduledAt: Date, meetingLink: string): Promise<LiveSessionRequestRecord>;
  completeRequest(id: string): Promise<LiveSessionRequestRecord>;
  cancelRequest(id: string, reason: string): Promise<LiveSessionRequestRecord>;
  updateMeetingLink(id: string, meetingLink: string): Promise<LiveSessionRequestRecord | undefined>;
}

export type PeoplePlatform = 'realtutorialhub' | 'skillup' | 'both';
export type PeopleUserRole = 'student' | 'faculty' | 'admin' | 'super_admin';

export interface PeopleDbClientLike {
  query: Record<string, any>;
  transaction: <T>(callback: (tx: PeopleDbClientLike) => Promise<T>) => Promise<T>;
  select: (...args: any[]) => any;
  insert: (...args: any[]) => any;
  update: (...args: any[]) => any;
  delete: (...args: any[]) => any;
}

export interface PeopleUserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: PeopleUserRole;
  platform: PeoplePlatform;
  isActive: boolean;
  deletedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeopleSubscriptionRecord {
  id: string;
  userId: string;
  planType: 'free' | 'pro' | 'enterprise';
  features: string[];
  status: 'active' | 'cancelled' | 'expired';
  startedAt: Date;
  expiresAt: Date | null;
  deletedAt: Date | null;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  roles: PeopleUserRole[];
  platforms: PeoplePlatform[];
  subscriptions: string[];
}

export interface AuthResultDTO {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDTO;
}

export interface IUserRepository {
  withDb(dbClient: PeopleDbClientLike): this;
  transaction<T>(callback: (repo: IUserRepository) => Promise<T>): Promise<T>;
  findByEmail(email: string): Promise<PeopleUserRecord | undefined>;
  findById(userId: string): Promise<PeopleUserRecord | undefined>;
  createUser(input: {
    email: string;
    passwordHash: string;
    role: PeopleUserRole;
    platform: PeoplePlatform;
  }): Promise<PeopleUserRecord>;
  createSubscription(input: {
    userId: string;
    planType: 'free' | 'pro' | 'enterprise';
    features: string[];
  }): Promise<PeopleSubscriptionRecord>;
  grantPlatformAccess(userId: string, platform: PeoplePlatform): Promise<unknown>;
  listPlatforms(userId: string): Promise<PeoplePlatform[]>;
  getActiveSubscription(userId: string): Promise<PeopleSubscriptionRecord | undefined>;
  createSession(input: {
    userId: string;
    jwtFamily: string;
    platform: PeoplePlatform;
    refreshTokenHash: string;
  }): Promise<unknown>;
  findSessionByFamily(userId: string, familyId: string): Promise<unknown>;
  revokeSessionByFamily(userId: string, familyId: string, reason: string): Promise<unknown>;
  revokeAllSessions(userId: string, reason: string): Promise<unknown>;
  createTokenFamily(input: { userId: string; familyId: string }): Promise<unknown>;
  findTokenFamilyByFamilyId(familyId: string): Promise<unknown>;
  markTokenFamilyCompromised(familyId: string): Promise<unknown>;
  updateTokenFamilyUsage(familyId: string): Promise<unknown>;
  createAuditLog(input: {
    actorId?: string | null;
    action: string;
    platform?: string | null;
    ip?: string | null;
    success?: boolean | null;
    metadata?: Record<string, unknown> | null;
  }): Promise<unknown>;
}
