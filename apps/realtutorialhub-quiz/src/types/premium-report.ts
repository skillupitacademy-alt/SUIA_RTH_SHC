export interface SubtopicAccuracy {
  name: string;
  accuracy: number;
}

export interface SkillAccuracy {
  name: string;
  accuracy: number;
}

export interface DifficultyAccuracy {
  level: 'simple' | 'intermediate' | 'expert';
  accuracy: number;
}

export interface HeatmapCell {
  subtopic: string;
  difficulty: 'simple' | 'intermediate' | 'expert';
  accuracy: number;
}

export interface AIRecommendation {
  status: 'READY' | 'BORDERLINE' | 'NOT READY';
  actions: string[];
  weakestSubtopic?: string;
  weakestSkill?: string;
  nextExamHours: number;
}

export interface PremiumExamReport {
  examId: string;
  score: number;
  mastery: number;
  readiness: number;
  subtopics: SubtopicAccuracy[];
  skills: SkillAccuracy[];
  difficulty: DifficultyAccuracy[];
  heatmap: HeatmapCell[];
  ai: AIRecommendation;
}
