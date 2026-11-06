export type ExportFormat = 'pdf' | 'json' | 'csv' | 'student-insight-pdf';
export type LearnerExportBrand = 'realtutorialhub' | 'skillup';

export function isLearnerExportBrand(value: unknown): value is LearnerExportBrand {
  return value === 'realtutorialhub' || value === 'skillup';
}

function extractBrandFromArtifactRef(ref: unknown): LearnerExportBrand | undefined {
  if (typeof ref !== 'string') return undefined;
  const trimmed = ref.trim();
  const match = /(?:^|\/)exports\/(realtutorialhub|skillup)\//i.exec(trimmed);
  if (match && isLearnerExportBrand(match[1].toLowerCase())) {
    return match[1].toLowerCase() as LearnerExportBrand;
  }
  return undefined;
}

function collectConsistentExplicitBrand(candidates: readonly unknown[]): LearnerExportBrand | undefined {
  let resolved: LearnerExportBrand | undefined;
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    if (!isLearnerExportBrand(candidate)) {
      return undefined;
    }
    if (resolved !== undefined && resolved !== candidate) {
      return undefined;
    }
    resolved = candidate;
  }
  return resolved;
}

export function resolveStoredExamBrand(exam: unknown): LearnerExportBrand | undefined {
  if (typeof exam !== 'object' || exam === null) return undefined;
  const record = exam as Record<string, unknown>;
  const exportUrls =
    typeof record.exportUrls === 'object' && record.exportUrls !== null
      ? (record.exportUrls as Record<string, unknown>)
      : null;
  const meta =
    exportUrls !== null && typeof exportUrls._meta === 'object' && exportUrls._meta !== null
      ? (exportUrls._meta as Record<string, unknown>)
      : null;

  const explicitBrand = collectConsistentExplicitBrand([
    record.brand,
    record.tenantId,
    exportUrls?.brand,
    exportUrls?.tenantId,
    meta?.brand,
    meta?.tenantId,
  ]);
  if (!explicitBrand) return undefined;

  if (exportUrls !== null) {
    for (const [key, value] of Object.entries(exportUrls)) {
      if (key === '_meta' || key === 'brand' || key === 'tenantId') continue;
      const refBrand = extractBrandFromArtifactRef(value);
      if (refBrand !== undefined && refBrand !== explicitBrand) {
        return undefined;
      }
    }
  }

  return explicitBrand;
}

export function resolveStoredJobBrand(job: unknown): LearnerExportBrand | undefined {
  if (typeof job !== 'object' || job === null) return undefined;
  const record = job as Record<string, unknown>;
  const payload =
    typeof record.payload === 'object' && record.payload !== null
      ? (record.payload as Record<string, unknown>)
      : null;
  const result =
    typeof record.result === 'object' && record.result !== null
      ? (record.result as Record<string, unknown>)
      : null;

  const explicitBrand = collectConsistentExplicitBrand([
    record.brand,
    record.tenantId,
    payload?.brand,
    payload?.tenantId,
    result?.brand,
    result?.tenantId,
  ]);
  if (!explicitBrand) return undefined;

  if (result !== null) {
    for (const ref of [result.downloadUrl, result.url, result.fileUrl]) {
      const refBrand = extractBrandFromArtifactRef(ref);
      if (refBrand !== undefined && refBrand !== explicitBrand) {
        return undefined;
      }
    }
  }

  return explicitBrand;
}

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
  brand?: 'realtutorialhub' | 'skillup';
  tenantId?: 'realtutorialhub' | 'skillup';
  ownerUserId?: string;
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
