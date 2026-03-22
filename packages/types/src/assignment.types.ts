export type AssignmentDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';
export type AssignmentQuestionType = 'mcq' | 'short_answer' | 'code' | 'open_ended';
export type AssignmentProgressStatus = 'not_started' | 'in_progress' | 'self_completed';
export type AssignmentHelpRequestStatus = 'open' | 'in_progress' | 'resolved';

export interface AssignmentRecord {
  id: string;
  subtopicId: string;
  difficulty: AssignmentDifficulty;
  questionType: AssignmentQuestionType;
  question: string;
  hints: string[];
  referenceAnswer: string;
  title: string;
  content: Record<string, unknown>;
  orderIndex: number | null;
  points: number;
  timeLimitSec: number | null;
  isPublished: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AssignmentProgressRecord {
  id: string;
  userId: string;
  subtopicId: string;
  difficulty: AssignmentDifficulty;
  status: AssignmentProgressStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AssignmentHelpRequestRecord {
  id: string;
  userId: string;
  subtopicId: string;
  assignmentId: string;
  question: string;
  status: AssignmentHelpRequestStatus;
  assignedTo: string | null;
  resolvedAt: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AssignmentTierStatusEntry {
  status: AssignmentProgressStatus;
  isUnlocked: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
}

export interface AssignmentTierStatusMap {
  simple: AssignmentTierStatusEntry;
  mixed: AssignmentTierStatusEntry;
  intermediate: AssignmentTierStatusEntry;
  expert: AssignmentTierStatusEntry;
}

export interface AssignmentHelpRequestCreateInput {
  userId: string;
  subtopicId: string;
  assignmentId: string;
  question: string;
  status?: AssignmentHelpRequestStatus;
  assignedTo?: string | null;
  resolvedAt?: Date | null;
}

export interface AssignmentHelpRequestUpdateInput {
  status?: AssignmentHelpRequestStatus;
  assignedTo?: string | null;
  resolvedAt?: Date | null;
}

export interface AssignmentTierStatusQuery {
  simple: AssignmentTierStatusEntry;
  mixed: AssignmentTierStatusEntry;
  intermediate: AssignmentTierStatusEntry;
  expert: AssignmentTierStatusEntry;
}
