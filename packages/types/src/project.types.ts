export type ProjectScope = 'topic' | 'subject' | 'domain';
export type ProjectLevel = 'simple' | 'intermediate' | 'expert';
export type ProjectDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';
export type ProjectSubmissionStatus =
  | 'submitted'
  | 'ai_reviewing'
  | 'needs_review'
  | 'approved'
  | 'revision_needed'
  | 'pending'
  | 'graded'
  | 'revision-requested';

export interface ProjectReviewChecklistItem {
  item: string;
  passed: boolean;
  note?: string;
}

export interface ProjectReviewPayload {
  feedback: string;
  checklist: ProjectReviewChecklistItem[];
  suggestedStatus: 'needs_review';
}

export interface ProjectRecord {
  id: string;
  scope: ProjectScope;
  parentId: string;
  level: ProjectLevel;
  title: string;
  description: string | null;
  deliverableType: 'code' | 'repo' | 'live_demo' | 'document';
  evaluationType: 'auto' | 'ai_review' | 'peer_review' | 'admin_review';
  estimatedHours: number | null;
  badgeId: string | null;
  subtopicsCovered: string[];
  prerequisites: string[];
  isPublished: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProjectSubmissionRecord {
  id: string;
  userId: string;
  projectId: string;
  projectLevel: ProjectLevel;
  difficulty: ProjectDifficulty;
  submissionContent: Record<string, unknown>;
  status: ProjectSubmissionStatus;
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

export interface ProjectSubmissionCreateInput {
  userId: string;
  projectId: string;
  projectLevel: ProjectLevel;
  difficulty: ProjectDifficulty;
  submissionContent: Record<string, unknown>;
  status?: ProjectSubmissionStatus;
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

export interface ProjectBadgeRecord {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  level: ProjectLevel | null;
  scope: ProjectScope | null;
  criteria: Record<string, unknown> | null;
  version: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ProjectBadgeAwardRecord {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: Date;
  projectSubmissionId: string | null;
  deletedAt: Date | null;
}

export interface ProjectEligibilityResult {
  eligible: boolean;
  missingRequirements: string[];
}

export interface ProjectCertificateRecord {
  id: string;
  userId: string;
  scope: ProjectScope;
  parentId: string;
  parentName: string;
  verificationCode: string;
  pdfUrl: string | null;
  issuedAt: Date;
  expiresAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
