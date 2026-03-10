import { FetchClient, TIMEOUTS } from '../core/fetch-client';

export interface TutorInsightSignal {
  type: 'good' | 'neutral' | 'risk';
  text: string;
}

export interface TutorInsight {
  title: string;
  measures: string;
  matters: string;
  howToRead: string;
  signals: TutorInsightSignal[];
  nextSteps: string[];
  confidence: 'low' | 'medium' | 'high';
  sampleSize: number;
  expectedOutcome: string;
  dataNotes?: { label: string; value: string }[];
}

export interface ScoreHistoryResponse {
  dates: string[];
  scores: number[];
  insight?: TutorInsight;
}

export interface MasteryTrendResponse {
  dates: string[];
  accuracy: number[];
  insight?: TutorInsight;
}

export interface ScoreHistogramResponse {
  bins: string[];
  counts: number[];
}

export interface TopicSkillHeatmapResponse {
  topics: string[];
  skills: string[];
  matrix: [number, number, number][];
}

export interface ItemDifficultyResponse {
  ids: string[];
  accuracy: number[];
  attempts: number[];
}

export interface TopicPerformanceResponse {
  topics: string[];
  accuracy: number[];
}

export interface WeaknessTreeNode {
  name: string;
  value?: number;
  children?: WeaknessTreeNode[];
}

export interface DiscriminationResponse {
  points: { id: string; top: number; bottom: number }[];
}

export interface TimeBoxplotResponse {
  data: number[];
}

export interface DifficultyAccuracyResponse {
  labels: string[];
  accuracy: number[];
}

export interface PoolSufficiencyResponse {
  available: number;
  required: number;
  percent: number;
}

export interface DifficultyVarianceResponse {
  labels: string[];
  planned: number[];
  actual: number[];
}

export class AnalyticsClient {
  constructor(private client: FetchClient) {}

  /**
   * Fetch personal score history for the authenticated user (Last 10 exams).
   */
  async getUserScoreHistory(): Promise<ScoreHistoryResponse> {
    return this.client.get<ScoreHistoryResponse>('/analytics/user/score-history', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch personal mastery trend for the authenticated user.
   */
  async getUserMasteryTrend(): Promise<MasteryTrendResponse> {
    return this.client.get<MasteryTrendResponse>('/analytics/user/mastery-trend', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch personal topic performance (accuracy per topic).
   */
  async getUserTopicPerformance(): Promise<TopicPerformanceResponse> {
    return this.client.get<TopicPerformanceResponse>('/analytics/user/topic-performance', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch personal weakness tree (Domain → Topic → Skill hierarchy).
   */
  async getUserWeaknessTree(): Promise<WeaknessTreeNode[]> {
    return this.client.get<WeaknessTreeNode[]>('/analytics/user/weakness-tree', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch personal time-per-question distribution (Pacing analysis).
   */
  async getUserTimeBoxplot(): Promise<TimeBoxplotResponse> {
    return this.client.get<TimeBoxplotResponse>('/analytics/user/time-boxplot', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch personal accuracy per difficulty level.
   */
  async getUserDifficultyAccuracy(): Promise<DifficultyAccuracyResponse> {
    return this.client.get<DifficultyAccuracyResponse>('/analytics/user/difficulty-accuracy', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch global score distribution (Admin only).
   */
  async getAdminScoreHistogram(): Promise<ScoreHistogramResponse> {
    return this.client.get<ScoreHistogramResponse>('/analytics/admin/score-histogram', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch global mastery trend (Admin only).
   */
  async getAdminMasteryTrend(): Promise<MasteryTrendResponse> {
    return this.client.get<MasteryTrendResponse>('/analytics/admin/mastery-trend', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch topic-skill heatmap (Admin only).
   */
  async getAdminTopicSkillHeatmap(): Promise<TopicSkillHeatmapResponse> {
    return this.client.get<TopicSkillHeatmapResponse>('/analytics/admin/topic-skill-heatmap', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch item difficulty report (Admin only).
   */
  async getAdminItemDifficulty(): Promise<ItemDifficultyResponse> {
    return this.client.get<ItemDifficultyResponse>('/analytics/admin/item-difficulty', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch item discrimination analysis (Admin only).
   */
  async getAdminDiscrimination(): Promise<DiscriminationResponse> {
    return this.client.get<DiscriminationResponse>('/analytics/admin/discrimination', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch question pool sufficiency data (Admin only).
   */
  async getAdminPoolSufficiency(): Promise<PoolSufficiencyResponse> {
    return this.client.get<PoolSufficiencyResponse>('/analytics/admin/pool-sufficiency', { timeout: TIMEOUTS.LONG });
  }

  /**
   * Fetch planned vs actual difficulty variance (Admin only).
   */
  async getAdminPlannedVsActualDifficulty(): Promise<DifficultyVarianceResponse> {
    return this.client.get<DifficultyVarianceResponse>('/analytics/admin/planned-vs-actual-difficulty', { timeout: TIMEOUTS.LONG });
  }
}
