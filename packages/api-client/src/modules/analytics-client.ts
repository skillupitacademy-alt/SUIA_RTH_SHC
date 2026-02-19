import { FetchClient } from '../core/fetch-client';

export interface ScoreHistoryResponse {
  dates: string[];
  scores: number[];
}

export interface MasteryTrendResponse {
  dates: string[];
  accuracy: number[];
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

export class AnalyticsClient {
  constructor(private client: FetchClient) {}

  /**
   * Fetch personal score history for the authenticated user (Last 10 exams).
   */
  async getUserScoreHistory(): Promise<ScoreHistoryResponse> {
    return this.client.get<ScoreHistoryResponse>('/analytics/user/score-history');
  }

  /**
   * Fetch personal mastery trend for the authenticated user.
   */
  async getUserMasteryTrend(): Promise<MasteryTrendResponse> {
    return this.client.get<MasteryTrendResponse>('/analytics/user/mastery-trend');
  }

  /**
   * Fetch global score distribution (Admin only).
   */
  async getAdminScoreHistogram(): Promise<ScoreHistogramResponse> {
    return this.client.get<ScoreHistogramResponse>('/analytics/admin/score-histogram');
  }

  /**
   * Fetch global mastery trend (Admin only).
   */
  async getAdminMasteryTrend(): Promise<MasteryTrendResponse> {
    return this.client.get<MasteryTrendResponse>('/analytics/admin/mastery-trend');
  }

  /**
   * Fetch topic-skill heatmap (Admin only).
   */
  async getAdminTopicSkillHeatmap(): Promise<TopicSkillHeatmapResponse> {
    return this.client.get<TopicSkillHeatmapResponse>('/analytics/admin/topic-skill-heatmap');
  }

  /**
   * Fetch item difficulty report (Admin only).
   */
  async getAdminItemDifficulty(): Promise<ItemDifficultyResponse> {
    return this.client.get<ItemDifficultyResponse>('/analytics/admin/item-difficulty');
  }
}
