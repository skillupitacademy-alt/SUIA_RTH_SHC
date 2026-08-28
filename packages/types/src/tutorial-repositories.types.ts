import type {
  ContentBlockType,
  TutorialContentAuditCreateInput,
  TutorialContentAuditRecord,
  TutorialContentVersionCreateInput,
  TutorialContentVersionRecord,
} from './tutorial-content.types';
import type { TutorialContentJSON } from './tutorial-content.schema';
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

// Import canonical TutorialDifficulty from tutorial-composer contracts
import type { TutorialDifficulty } from './tutorial-composer/contracts';

// Re-export for backward compatibility
export type { TutorialDifficulty };

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

/**
 * Phase 2.6: Completed Block Record
 * 
 * Preserves block identity and version across content revisions.
 */
export interface CompletedBlockRecord {
  blockId: string;
  blockVersion: string; // e.g., "D1", "C1", "S1"
  completedAt: string; // ISO timestamp
}

/**
 * Phase 2.6: Navigation Progress Record
 * 
 * Per-navigation-node learner progress
 */
export interface TutorialNavigationProgressRecord {
  id: string;
  userId: string;
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedBlocks: CompletedBlockRecord[]; // Block records with versions
  timeSpentActiveSec: number;
  visitCount: number;
  revisionCount: number;
  lastSessionId: string | null; // JWT family ID or client session UUID
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  completedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Phase 2.6: Navigation Progress Create Input
 */
export interface TutorialNavigationProgressCreateInput {
  userId: string;
  navigationNodeId: string;
  sectionId?: string | null;
  subtopicId: string;
}

/**
 * Phase 2.6: Block Completion Event
 * 
 * IMPORTANT: Preserves blockVersion to track content revisions
 */
export interface TutorialBlockCompletionEvent {
  userId: string;
  navigationNodeId: string;
  sectionId: string | null;
  subtopicId: string;
  blockId: string;
  blockType: string;
  blockVersion: string; // e.g., "D1", "C1", "S1"
  sessionId?: string; // Optional: Learning session identifier for idempotency
  occurredAt?: Date;
}

/**
 * Phase 2.6: Time Update Event
 */
export interface TutorialTimeUpdateEvent {
  userId: string;
  navigationNodeId: string;
  subtopicId: string;
  timeSpentActiveSec: number; // Accumulated active time
  sessionId?: string; // Optional: For deduplication
}

/**
 * Phase 2.6: Visit Event
 * 
 * SESSION SEMANTICS:
 * - sessionId: REQUIRED learning session identifier (JWT family ID or client-generated UUID)
 * - Service layer owns session ID generation:
 *   * Authenticated users: JWT family/session ID
 *   * Anonymous users: Stable client session UUID
 * - Repository uses sessionId for atomic session transition detection
 * - IS DISTINCT FROM comparison determines new vs same session
 * 
 * REVISION SEMANTICS:
 * - Revision = return to previously completed node in a new session
 * - Automatically detected by repository when:
 *   * status = 'completed' AND sessionId different from lastSessionId
 */
export interface TutorialVisitEvent {
  userId: string;
  navigationNodeId: string;
  subtopicId: string;
  sessionId: string; // REQUIRED - service must provide stable session identity
  occurredAt?: Date;
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

/**
 * Phase 2.6: Navigation Progress Repository Interface
 * 
 * COMPLETION POLICY BOUNDARY:
 * - Repository: Persistence layer only
 * - Service: Business logic and completion eligibility validation
 * 
 * SERVICE LAYER RESPONSIBILITY (NOT REPOSITORY):
 * - Determine if node can be marked complete
 * - Validate required blocks completed
 * - Apply D1/C1/S1-specific completion rules
 * - Determine session boundaries for visit counting
 * - Determine revision triggers (return after completion)
 * 
 * REPOSITORY RESPONSIBILITY:
 * - Persist progress state
 * - Ensure idempotency
 * - Atomic updates
 * - Concurrency-safe operations
 */
export interface ITutorialNavigationProgressRepository {
  withDb(dbClient: TutorialDbClientLike): this;
  
  // Core CRUD
  findById(id: string): Promise<TutorialNavigationProgressRecord | undefined>;
  getProgress(userId: string, navigationNodeId: string): Promise<TutorialNavigationProgressRecord | undefined>;
  getProgressForSubtopic(userId: string, subtopicId: string): Promise<TutorialNavigationProgressRecord[]>;
  createProgress(data: TutorialNavigationProgressCreateInput): Promise<TutorialNavigationProgressRecord>;
  
  // Block completion (idempotent, preserves blockVersion)
  markBlockCompleted(event: TutorialBlockCompletionEvent): Promise<TutorialNavigationProgressRecord>;
  isBlockCompleted(userId: string, navigationNodeId: string, blockId: string, blockVersion?: string): Promise<boolean>;
  
  // Time tracking (cumulative, validated)
  recordTime(event: TutorialTimeUpdateEvent): Promise<TutorialNavigationProgressRecord>;
  
  // Visit tracking (service determines increment logic)
  recordVisit(event: TutorialVisitEvent): Promise<TutorialNavigationProgressRecord>;
  incrementRevision(userId: string, navigationNodeId: string): Promise<TutorialNavigationProgressRecord>;
  
  // Completion (service validates eligibility before calling)
  completeNode(userId: string, navigationNodeId: string): Promise<TutorialNavigationProgressRecord>;
  
  // Queries
  getCompletedNodes(userId: string, subtopicId: string): Promise<string[]>; // Returns navigationNodeIds
  isNodeComplete(userId: string, navigationNodeId: string): Promise<boolean>;
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

export type PeoplePlatform = 'realtutorialhub' | 'skillup';
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

export interface PeopleSessionRecord {
  id: string;
  userId: string;
  familyId: string | null;
  platform: PeoplePlatform;
  revokedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
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
  revokePlatformAccess(userId: string, platform: PeoplePlatform): Promise<unknown>;
  listPlatforms(userId: string): Promise<PeoplePlatform[]>;
  getActiveSubscription(userId: string): Promise<PeopleSubscriptionRecord | undefined>;
  createSession(input: {
    userId: string;
    jwtFamily: string;
    platform: PeoplePlatform;
    refreshTokenHash: string;
  }): Promise<unknown>;
  listActiveSessions(userId: string): Promise<PeopleSessionRecord[]>;
  findSessionById(userId: string, sessionId: string): Promise<PeopleSessionRecord | null>;
  revokeSessionById(userId: string, sessionId: string, reason: string): Promise<void>;
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
