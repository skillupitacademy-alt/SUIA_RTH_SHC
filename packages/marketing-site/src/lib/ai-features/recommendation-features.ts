import type { LeadScoreSnapshot } from "../analytics/lead-scoring";

export function buildRecommendationFeatures(lead: LeadScoreSnapshot) {
  return {
    recommendation_lead_score: lead.score,
    recommendation_hot_lead: lead.temperature === "hot",
    recommendation_segment_count: lead.segments.length,
  };
}

