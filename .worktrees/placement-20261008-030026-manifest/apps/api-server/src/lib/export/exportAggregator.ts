import { withSpan } from '@/lib/tracer';

import type { 
  AggregationRow, 
  ExportPayload, 
  GuidanceSignalRow, 
  HistoricalProgressRow, 
  RawAttemptRow} from './exportTypes';

export class ExportAggregator {
  private groupAndCompute(rows: RawAttemptRow[], keys: GroupKey[]): AggregationRow[] {
    const groups = new Map<string, RawAttemptRow[]>();

    rows.forEach(row => {
      const groupKey = keys.map(k => String(row[k])).join('|');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(row);
    });

    const results: AggregationRow[] = [];

    groups.forEach((groupRows, _key) => {
      const totalAttempts = groupRows.length;
      const correctAnswers = groupRows.filter(r => r.isCorrect).length;
      const accuracyPct = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

      const totalTime = groupRows.reduce((acc, r) => acc + r.timeSpentSeconds, 0);
      const avgTimeSec = totalAttempts > 0 ? totalTime / totalAttempts : 0;

      const totalWeight = groupRows.reduce((acc, r) => acc + r.masteryWeight, 0);
      const earnedWeight = groupRows.reduce((acc, r) => acc + r.weightedScore, 0);
      const masteryScorePct = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;

      const stableProcessingPct = totalAttempts > 0
        ? (groupRows.filter(r => r.processingPattern === 'stable').length / totalAttempts) * 100
        : 0;
      const logicProcessingPct = totalAttempts > 0
        ? (groupRows.filter(r => r.processingPattern === 'logic').length / totalAttempts) * 100
        : 0;
      const errorTimePct = totalAttempts > 0
        ? (groupRows.filter(r => r.processingPattern === 'neural_error').length / totalAttempts) * 100
        : 0;

      const impulsivePct = totalAttempts > 0
        ? (groupRows.filter(r => r.isImpulsive).length / totalAttempts) * 100
        : 0;
      const diligentPct = totalAttempts > 0
        ? (groupRows.filter(r => r.isDiligent).length / totalAttempts) * 100
        : 0;

      const expertRows = groupRows.filter(r => (r.difficulty || '').toLowerCase() === 'expert');
      const simpleRows = groupRows.filter(r => (r.difficulty || '').toLowerCase() === 'simple');

      const expertAccuracyPct = expertRows.length > 0 
        ? (expertRows.filter(r => r.isCorrect).length / expertRows.length) * 100 
        : 0;
      
      const simpleAccuracyPct = simpleRows.length > 0 
        ? (simpleRows.filter(r => r.isCorrect).length / simpleRows.length) * 100 
        : 0;

      const expertDropoff = simpleAccuracyPct - expertAccuracyPct;

      let readinessLevel: 'Expert-Ready' | 'Intermediate' | 'Novice-Stable' = 'Novice-Stable';
      if (expertAccuracyPct >= 60) readinessLevel = 'Expert-Ready';
      else if (expertAccuracyPct >= 35) readinessLevel = 'Intermediate';

      const baseRow: GroupedAggregationRow = {
        totalAttempts,
        correctAnswers,
        accuracyPct,
        avgTimeSec,
        masteryScorePct,
        stableProcessingPct,
        logicProcessingPct,
        errorTimePct,
        impulsivePct,
        diligentPct,
        expertAccuracyPct,
        simpleAccuracyPct,
        expertDropoff,
        readinessLevel
      } as AggregationRow & Record<string, unknown>;

      // Add back the keys
      keys.forEach(k => {
        const keyValue = groupRows[0][k];
        baseRow[k] = keyValue;
      });

      results.push(baseRow);
    });

    return results;
  }

  async buildAggregations(currentRows: RawAttemptRow[]): Promise<ExportPayload['aggregations']> {
    return withSpan('ExportAggregator.buildAggregations', async () => {
      return {
        L1_domain: this.groupAndCompute(currentRows, ['domain']),
        L2_domain_subject: this.groupAndCompute(currentRows, ['domain', 'subject']),
        L3_domain_subject_topic: this.groupAndCompute(currentRows, ['domain', 'subject', 'topic']),
        L4_full_hierarchy: this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'subtopic']),
        L5_difficulty: this.groupAndCompute(currentRows, ['domain', 'subject', 'difficulty']),
        L6_skill: this.groupAndCompute(currentRows, ['domain', 'subject', 'skillName']),
        L7_topic_x_difficulty: this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'difficulty']),
        L8_topic_x_skill: this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'skillName']),
        L9_full_granular: this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'subtopic', 'difficulty', 'skillName']),
        L10_student_domain: this.groupAndCompute(currentRows, ['studentId', 'domain']),
        L11_student_full_hierarchy: this.groupAndCompute(currentRows, ['studentId', 'domain', 'subject', 'topic', 'subtopic']),
        L12_student_diff_skill: this.groupAndCompute(currentRows, ['studentId', 'domain', 'difficulty', 'skillName'])
      };
    });
  }

  async buildHistoricalProgress(historicalRows: RawAttemptRow[]): Promise<HistoricalProgressRow[]> {
    return withSpan('ExportAggregator.buildHistoricalProgress', async () => {
      if (historicalRows.length === 0) return [];

      // Group by session first to assign session index
      const sessions = Array.from(new Set(historicalRows.map(r => r.sessionId)))
        .sort((a, b) => {
          const dateA = historicalRows.find(r => r.sessionId === a)?.sessionDate ?? '';
          const dateB = historicalRows.find(r => r.sessionId === b)?.sessionDate ?? '';
          return dateA.localeCompare(dateB);
        });

      const sessionIndices = new Map(sessions.map((id, i) => [id, i + 1]));

      // Aggregate historical rows at granular level L9 equivalent
      const aggs = this.groupAndCompute(historicalRows, [
        'sessionId', 'sessionDate', 'domain', 'subject', 'topic', 'subtopic', 'difficulty', 'skillName'
      ]);

      type HistoricalAgg = AggregationRow & Pick<
        RawAttemptRow,
        'sessionId' | 'sessionDate' | 'domain' | 'subject' | 'topic' | 'subtopic' | 'difficulty' | 'skillName'
      >;

      return (aggs as HistoricalAgg[]).map((agg) => {
        const prevIndex = (sessionIndices.get(agg.sessionId) ?? 1) - 2;
        const prevSessionId = prevIndex >= 0 ? sessions[prevIndex] : undefined;
        const prevAgg = prevSessionId !== undefined
          ? (aggs as HistoricalAgg[]).find((a) => a.sessionId === prevSessionId && a.subtopic === agg.subtopic && a.skillName === agg.skillName)
          : undefined;

        let trend: 'improving' | 'regressing' | 'stable' = 'stable';
        if (prevAgg !== undefined) {
          const diff = agg.accuracyPct - prevAgg.accuracyPct;
          if (diff > 5) trend = 'improving';
          else if (diff < -5) trend = 'regressing';
        }

        return {
          sessionId: agg.sessionId,
          sessionDate: agg.sessionDate,
          domain: agg.domain,
          subject: agg.subject,
          topic: agg.topic,
          subtopic: agg.subtopic,
          difficulty: agg.difficulty,
          skillName: agg.skillName,
          accuracyPct: agg.accuracyPct,
          masteryScorePct: agg.masteryScorePct,
          expertDropoff: agg.expertDropoff,
          readinessLevel: agg.readinessLevel,
          sessionIndex: sessionIndices.get(agg.sessionId)!,
          trend
        } as HistoricalProgressRow;
      });
    });
  }

  buildGuidanceSignals(currentRows: RawAttemptRow[], _historicalRows: RawAttemptRow[]): GuidanceSignalRow[] {
    const signals: GuidanceSignalRow[] = [];
    const historicalTrendMaps = {
      l4: this.buildTrendMap(_historicalRows, ['domain', 'subject', 'topic', 'subtopic']),
      l6: this.buildTrendMap(_historicalRows, ['domain', 'subject', 'skillName']),
      l7: this.buildTrendMap(_historicalRows, ['domain', 'subject', 'topic', 'difficulty']),
      l9: this.buildTrendMap(_historicalRows, ['domain', 'subject', 'topic', 'subtopic', 'difficulty', 'skillName'])
    };

    // 1. Critical Gaps (L9 where accuracy < 40% and attempts >= 2)
    const l9 = this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'subtopic', 'difficulty', 'skillName']);
    l9.filter(r => r.accuracyPct < 40 && r.totalAttempts >= 2).forEach(r => {
      const trendKey = this.buildTrendKey(r, ['domain', 'subject', 'topic', 'subtopic', 'difficulty', 'skillName']);
      signals.push({
        signalType: 'Critical Gap',
        hierarchy: this.buildHierarchy(r),
        dimension: `${r.skillName} (${r.difficulty})`,
        currentValue: r.accuracyPct,
        historicalTrend: historicalTrendMaps.l9.get(trendKey) ?? [],
        severity: 'HIGH',
        recommendation: `Immediate remediation required for foundational logic in ${r.subtopic}.`
      });
    });

    // 2. Skill Deficit (L6 where masteryScorePct < 45)
    const l6 = this.groupAndCompute(currentRows, ['domain', 'subject', 'skillName']);
    l6.filter(r => r.masteryScorePct < 45).forEach(r => {
      const trendKey = this.buildTrendKey(r, ['domain', 'subject', 'skillName']);
      signals.push({
        signalType: 'Skill Deficit',
        hierarchy: this.buildHierarchy(r),
        dimension: r.skillName!,
        currentValue: r.masteryScorePct,
        historicalTrend: historicalTrendMaps.l6.get(trendKey) ?? [],
        severity: 'MEDIUM',
        recommendation: `Tactical drills suggested for ${r.skillName} across multiple areas.`
      });
    });

    // 3. Time Anomaly (L7 where avgTimeSec > 70)
    const l7 = this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'difficulty']);
    l7.filter(r => r.avgTimeSec > 70).forEach(r => {
      const trendKey = this.buildTrendKey(r, ['domain', 'subject', 'topic', 'difficulty']);
      signals.push({
        signalType: 'Time Anomaly',
        hierarchy: this.buildHierarchy(r),
        dimension: r.difficulty!,
        currentValue: r.avgTimeSec,
        historicalTrend: historicalTrendMaps.l7.get(trendKey) ?? [],
        severity: 'MEDIUM',
        recommendation: `Latency at ${r.difficulty} tier exceeds safety threshold. Optimize cognitive retrieval.`
      });
    });

    // 4. Strength Zone (L4 where stable > 70% and accuracy > 80%)
    const l4 = this.groupAndCompute(currentRows, ['domain', 'subject', 'topic', 'subtopic']);
    l4.filter(r => r.stableProcessingPct > 70 && r.accuracyPct > 80).forEach(r => {
      const trendKey = this.buildTrendKey(r, ['domain', 'subject', 'topic', 'subtopic']);
      signals.push({
        signalType: 'Strength Zone',
        hierarchy: this.buildHierarchy(r),
        dimension: 'Integrated Mastery',
        currentValue: r.accuracyPct,
        historicalTrend: historicalTrendMaps.l4.get(trendKey) ?? [],
        severity: 'POSITIVE',
        recommendation: `High automaticity achieved in ${r.subtopic}. Ready for expert-level extension.`
      });
    });

    // 5. Historical Regression (drop > 15 points vs last session)
    const currentMap = this.buildCurrentAccuracyMap(currentRows, ['domain', 'subject', 'topic', 'subtopic', 'difficulty', 'skillName']);
    const historyMap = historicalTrendMaps.l9;
    currentMap.forEach((currentValue, key) => {
      const history = historyMap.get(key);
      if (history === undefined || history.length === 0) return;
      const last = history[history.length - 1];
      if (currentValue <= last.value - 15) {
        const parts = key.split('|');
        const dimension = parts[5] ? `${parts[5]} (${parts[4] ?? 'unknown'})` : parts[4] ?? 'unknown';
        signals.push({
          signalType: 'Historical Regression',
          hierarchy: this.buildHierarchy({
            domain: parts[0],
            subject: parts[1],
            topic: parts[2],
            subtopic: parts[3]
          }),
          dimension,
          currentValue,
          historicalTrend: history,
          severity: 'HIGH',
          recommendation: `Performance dropped by more than 15 points since last session. Review recent gaps in ${parts[3] ?? 'the current subtopic'}.`
        });
      }
    });

    return signals;
  }

  private buildTrendMap(rows: RawAttemptRow[], keys: GroupKey[]): Map<string, Array<{ sessionDate: string; value: number }>> {
    const trendMap = new Map<string, Array<{ sessionDate: string; value: number }>>();
    if (rows.length === 0) return trendMap;

    const aggs = this.groupAndCompute(rows, ['sessionId', 'sessionDate', ...keys]);
    aggs.forEach((agg) => {
      const trendKey = this.buildTrendKey(agg, keys);
      if (!trendMap.has(trendKey)) {
        trendMap.set(trendKey, []);
      }
      const sessionDate = (agg as { sessionDate?: string }).sessionDate ?? '';
      trendMap.get(trendKey)!.push({ sessionDate, value: agg.accuracyPct });
    });

    trendMap.forEach((items) => {
      items.sort((a, b) => a.sessionDate.localeCompare(b.sessionDate));
    });

    return trendMap;
  }

  private buildCurrentAccuracyMap(rows: RawAttemptRow[], keys: GroupKey[]): Map<string, number> {
    const map = new Map<string, number>();
    if (rows.length === 0) return map;
    const aggs = this.groupAndCompute(rows, keys);
    aggs.forEach((agg) => {
      const trendKey = this.buildTrendKey(agg, keys);
      map.set(trendKey, agg.accuracyPct);
    });
    return map;
  }

  private buildTrendKey(record: Partial<Record<GroupKey, string>>, keys: GroupKey[]): string {
    return keys.map((k) => record[k] ?? '').join('|');
  }

  private buildHierarchy(record: Partial<Record<GroupKey, string>>): string {
    const domain = record.domain ?? 'General';
    const subject = record.subject ?? 'General';
    const topic = record.topic ?? 'General';
    const subtopic = record.subtopic ?? 'General';
    return `${domain} > ${subject} > ${topic} > ${subtopic}`;
  }
}

type GroupKey = keyof Pick<
  RawAttemptRow,
  'domain' | 'subject' | 'topic' | 'subtopic' | 'difficulty' | 'skillName' | 'studentId' | 'sessionId' | 'sessionDate'
>;

type GroupedAggregationRow = AggregationRow & Partial<Record<GroupKey, string>>;
