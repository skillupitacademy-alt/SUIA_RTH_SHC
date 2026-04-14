export interface BaseEntity {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Domain extends BaseEntity {
  icon?: string;
  category?: string;
}

export interface Subject extends BaseEntity {
  domainId: string;
  icon?: string;
  orderIndex?: number;
}

export interface Topic extends BaseEntity {
  subjectId: string;
  orderIndex?: number;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Subtopic extends BaseEntity {
  topicId: string;
  orderIndex?: number;
}

export interface Skill extends BaseEntity {
  category?: string;
  topicId?: string;
}

export interface QuestionOption {
  id: string;
  text?: string;
  code?: string;
  label?: string;
  isCorrect?: boolean;
}

export interface QuestionSummary {
  id: string;
  questionText: string;
  type?: string;
  questionType?: 'mcq' | 'code_mcq' | 'multi_select';
  displayType?: 'text' | 'code' | 'mixed';
  status?: string;
  difficulty?: string;
  topicId?: string;
  subtopicId?: string;
  skillIds?: string[];
  options?: QuestionOption[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin' | 'infrastructure';
  onboarded?: boolean;
  isAdmin: boolean;
  professionalStatus?: string;
  educationLevel?: string;
  domainInterest?: string[];
}

export interface AdminUserProfile extends UserProfile {
  isAdmin: true;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  nextCursor: string | null;
  hasMore?: boolean;
  page?: number;
  totalPages?: number;
}

export interface PaginatedQuestions extends PaginatedResponse<QuestionSummary> {
  // Maintaining 'questions' as an alias for 'data' for backward compatibility
  questions: QuestionSummary[];
}

export interface DomainHierarchy extends Domain {
  subjects: Array<
    Subject & {
      topics: Array<
        Topic & {
          subtopics: Subtopic[];
        }
      >;
    }
  >;
}

export interface QuestionCounts {
  simple: number;
  intermediate: number;
  expert: number;
  total: number;
  isReady?: boolean;
}

export interface ExamStartResponse {
  examId: string;
  status: string;
  totalQuestions: number;
  durationSeconds: number | null;
  remainingSeconds: number | null;
  firstQuestion: {
    id: string;
    questionText: string;
    options: QuestionOption[];
    codeSnippet: string | null;
    type: string;
    questionType?: 'mcq' | 'code_mcq' | 'multi_select';
    displayType?: 'text' | 'code' | 'mixed';
    difficulty: string;
  };
}

export interface ExamAnswerResponse {
  status: 'in_progress' | 'completed';
  question?: {
    id: string;
    questionText: string;
    options: QuestionOption[];
    codeSnippet?: string | null;
    type?: string;
    questionType?: 'mcq' | 'code_mcq' | 'multi_select';
    displayType?: 'text' | 'code' | 'mixed';
    difficulty?: string;
  };
  remainingSeconds?: number | null;
}

export interface BackgroundJob {
  id: string;
  userId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload?: Record<string, unknown> | null;
  result?: Record<string, unknown> | null;
  error?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export * from './types/admin.types';
