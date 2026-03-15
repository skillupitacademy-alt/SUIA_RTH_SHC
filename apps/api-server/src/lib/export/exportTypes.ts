export type ExportFormat = 'pdf' | 'json' | 'csv' | 'student-insight-pdf';

export interface ExportRequest {
  examId: string;
  userId: string;
  format: ExportFormat;
  includeHistory?: boolean;
}

export interface ExportJob {
  jobId: string;
  examId: string;
  userId: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  downloadUrl?: string;
  error?: string;
  createdAt: string;
}

export interface ExportMeta {
  candidateName: string;
  candidateEmail: string;
  vectorId: string;
  examId: string;
  startedAt: string;
  lineage: {
    domain: string;
    subject: string;
    topic: string;
  };
}

export interface RawAttemptRow {
  // Student & Session Identity
  studentId: string;
  studentName: string;
  studentEmail: string;
  sessionId: string;
  sessionDate: string;
  vectorId: string;

  // Full Hierarchy
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;

  // Question Info
  questionId: string;
  questionText: string;
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  difficulty: 'simple' | 'intermediate' | 'expert';
  timeSpentSeconds: number;
  thresholdSeconds: number;

  // Skill (Denormalized: one row per skill)
  skillName: string;
  skillCategory: string | null;

  // Computed Flags
  processingPattern: 'stable' | 'logic' | 'neural_error' | null;
  isImpulsive: boolean; // wrong + fast
  isDiligent: boolean;  // correct + slow
  masteryWeight: number; // 1, 2, or 3
  weightedScore: number; // masteryWeight if correct, else 0
}

export interface AggregationRow {
  // Dimension keys (optional depending on layer)
  domain?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  difficulty?: string;
  skillName?: string;
  studentId?: string;
  sessionId?: string;

  // KPIs
  totalAttempts: number;
  correctAnswers: number;
  accuracyPct: number;
  avgTimeSec: number;
  masteryScorePct: number;
  stableProcessingPct: number;
  logicProcessingPct: number;
  errorTimePct: number;
  impulsivePct: number;
  diligentPct: number;
  expertAccuracyPct: number;
  simpleAccuracyPct: number;
  expertDropoff: number;
  readinessLevel: 'Expert-Ready' | 'Intermediate' | 'Novice-Stable';
}

export interface GuidanceSignalRow {
  signalType: 'Critical Gap' | 'Skill Deficit' | 'Time Anomaly' | 'Strength Zone' | 'Historical Regression';
  hierarchy: string; // e.g. "Computer Science > SQL > JOINs"
  dimension: string; // specific node node
  currentValue: number;
  historicalTrend?: Array<{ sessionDate: string; value: number }>;
  severity: 'HIGH' | 'MEDIUM' | 'POSITIVE';
  recommendation: string;
}

export interface HistoricalProgressRow {
  sessionId: string;
  sessionDate: string;
  domain: string;
  subject: string;
  topic: string;
  subtopic: string;
  difficulty?: string;
  skillName?: string;
  accuracyPct: number;
  masteryScorePct: number;
  expertDropoff: number;
  readinessLevel: string;
  sessionIndex: number; // 1, 2, 3... chronologically
  trend: 'improving' | 'regressing' | 'stable';
}

export interface ExportPayload {
  meta: ExportMeta;
  rawAttempts: RawAttemptRow[];
  aggregations: {
    L1_domain: AggregationRow[];
    L2_domain_subject: AggregationRow[];
    L3_domain_subject_topic: AggregationRow[];
    L4_full_hierarchy: AggregationRow[];
    L5_difficulty: AggregationRow[];
    L6_skill: AggregationRow[];
    L7_topic_x_difficulty: AggregationRow[];
    L8_topic_x_skill: AggregationRow[];
    L9_full_granular: AggregationRow[];
    L10_student_domain: AggregationRow[];
    L11_student_full_hierarchy: AggregationRow[];
    L12_student_diff_skill: AggregationRow[];
  };
  historicalProgress: HistoricalProgressRow[];
  guidanceSignals: GuidanceSignalRow[];
}
