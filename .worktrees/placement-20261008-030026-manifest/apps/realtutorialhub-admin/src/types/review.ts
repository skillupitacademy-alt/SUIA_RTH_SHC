export interface DomainSummary {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status?: 'active' | 'inactive';
  subjectsCount?: number;
  subjects?: Array<{ id: string; name: string }>;
  createdAt?: string;
}

export interface SubjectSummary {
  id: string;
  name: string;
  domainId: string;
  status?: string;
  topicsCount?: number;
}

export interface TopicSummary {
  id: string;
  name: string;
  subjectId: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  status?: string;
}

export interface SubtopicSummary {
  id: string;
  name: string;
  topicId: string;
  status?: string;
}

export interface SkillSummary {
  id: string;
  name: string;
  category?: string;
  description?: string;
}

export type ReviewEntity =
  | DomainSummary
  | SubjectSummary
  | TopicSummary
  | SubtopicSummary
  | SkillSummary;
