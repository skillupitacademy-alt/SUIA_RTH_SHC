export interface RemediationWeakSubtopicInput {
  subtopicId: string
  subtopicName: string
  score: number
  threshold: number
}

export interface RemediationWeakSubtopicProgress extends RemediationWeakSubtopicInput {
  progress: 'not_started' | 'in_progress' | 'completed'
}

export interface RemediationOverallProgress {
  completed: number
  total: number
}

export type RemediationPlanStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface RemediationPlanRecord {
  id: string
  examResultId: string
  userId: string
  weakSubtopics: RemediationWeakSubtopicInput[]
  recommendedContentTypes: string[]
  status: RemediationPlanStatus
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface RemediationPlanResponse {
  examResultId: string
  weakSubtopics: RemediationWeakSubtopicProgress[]
  recommendations: string[]
  overallProgress: RemediationOverallProgress
  status: 'pending' | 'in_progress' | 'completed'
}

