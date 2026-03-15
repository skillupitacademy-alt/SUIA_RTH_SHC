import type { PremiumReport } from '../../../modules/report-engine/report.engine';
import type { 
  AggregationRow,
  ExportMeta, 
  ExportPayload, 
  GuidanceSignalRow, 
  HistoricalProgressRow
} from '../exportTypes';

export interface StudentInsightData {
  meta: ExportMeta;
  behaviour: {
    timePattern: string | null;
    stableCount: number;
    logicCount: number;
    errorCount: number;
    timeBuckets: {
      stable: number;
      logic: number;
      neural: number;
    };
  };
  knowledgeGap: {
    l1: AggregationRow[];
    l2: AggregationRow[];
    l3: GuidanceSignalRow[];
  };
  skills: {
    profile: AggregationRow[];
    byTopic: AggregationRow[];
    top3Weakest: AggregationRow[];
  };
  priorities: GuidanceSignalRow[];
  progress: HistoricalProgressRow[];
  nextSteps: {
    status: string;
    nextExamHours: number;
    actions: string[];
    weakestSubtopic?: string;
    weakestSkill?: string;
    criticalGap?: GuidanceSignalRow;
    score?: number;
  };
}

export class StudentInsightFormatter {
  format(payload: ExportPayload, premium: PremiumReport): StudentInsightData {
    // 1. Header & Meta
    const meta = payload.meta;

    // 2. Behaviour
    const behaviour = {
      timePattern: premium.timePattern ?? null,
      stableCount: premium.stableCount ?? 0,
      logicCount: premium.logicCount ?? 0,
      errorCount: premium.errorCount ?? 0,
      timeBuckets: premium.timeBuckets ?? { stable: 0, logic: 0, neural: 0 }
    };

    // 3. Knowledge Gap
    const l1Sorted = [...payload.aggregations.L2_domain_subject].sort((a, b) => a.accuracyPct - b.accuracyPct);
    const l2Sorted = [...payload.aggregations.L3_domain_subject_topic].sort((a, b) => a.accuracyPct - b.accuracyPct);
    const knowledgeGap = {
      l1: l1Sorted,
      l2: l2Sorted,
      l3: payload.guidanceSignals.filter(s => s.signalType === 'Critical Gap' && s.severity === 'HIGH')
    };

    // 4. Skills
    const profile = [...payload.aggregations.L6_skill].sort((a, b) => a.accuracyPct - b.accuracyPct);
    const skills = {
      profile,
      byTopic: payload.aggregations.L8_topic_x_skill,
      top3Weakest: profile.slice(0, 3)
    };

    // 5. Priorities
    const severityOrder: Record<string, number> = { 'HIGH': 0, 'MEDIUM': 1, 'POSITIVE': 2 };
    const priorities = [...payload.guidanceSignals].sort((a, b) => (severityOrder[a.severity] ?? 99) - (severityOrder[b.severity] ?? 99));

    // 6. Progress
    const progress = payload.historicalProgress;

    // 7. Next Steps
    const nextSteps = {
      status: (premium.ai?.status as string | undefined) ?? 'Stable',
      nextExamHours: (premium.ai?.nextExamHours as number | undefined) ?? 48,
      actions: (premium.ai?.actions as string[] | undefined) ?? [],
      weakestSubtopic: premium.ai?.weakest_subtopic,
      weakestSkill: premium.ai?.weakest_skill,
      criticalGap: knowledgeGap.l3[0],
      score: premium.score ?? 0
    };

    return {
      meta,
      behaviour,
      knowledgeGap,
      skills,
      priorities,
      progress,
      nextSteps
    };
  }
}
