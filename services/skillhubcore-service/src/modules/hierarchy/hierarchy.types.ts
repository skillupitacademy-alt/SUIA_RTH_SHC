export interface HierarchyDomainDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface HierarchySubjectDTO {
  id: string;
  domainId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface HierarchyTopicDTO {
  id: string;
  subjectId: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface HierarchySubtopicDTO {
  id: string;
  topicId: string;
  name: string;
  slug: string;
  description: string | null;
  difficultyLevels: string[];
}

export interface CreateSubtopicInput {
  topicId: string;
  subjectId: string;
  domainId: string;
  name: string;
  slug: string;
  description?: string | null;
  difficultyLevels: string[];
}
