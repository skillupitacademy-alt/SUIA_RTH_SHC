import type { AnalyticsEventEnvelope } from "./events";
import type { FunnelProgressRecord } from "./funnel";
import type { LeadScoreSnapshot } from "./lead-scoring";

export interface WarehouseEventRow {
  event_date: string;
  event_timestamp: string;
  brand_id: string;
  event_name: string;
  session_id: string;
  anonymous_id: string;
  user_id?: string;
  page_path?: string;
  traffic_source?: string;
  traffic_medium?: string;
  traffic_campaign?: string;
  lead_score?: number;
  lead_temperature?: string;
  funnel_ids: string[];
  payload_json: string;
  metadata_json: string;
}

export interface WarehouseModelContract {
  dataset: string;
  tables: string[];
  partitionBy: string;
  clusterBy: string[];
  retentionDays: number;
}

export const warehouseContract: WarehouseModelContract = {
  dataset: "marketing_intelligence",
  tables: [
    "fact_marketing_events",
    "fact_funnel_progress",
    "dim_marketing_sessions",
    "dim_marketing_users",
    "fact_lead_scores",
    "fact_marketing_automations",
  ],
  partitionBy: "event_date",
  clusterBy: ["brand_id", "event_name", "traffic_source"],
  retentionDays: 730,
};

export function buildWarehouseEventRow(
  event: AnalyticsEventEnvelope,
  leadScore: LeadScoreSnapshot,
  funnelProgress: FunnelProgressRecord[],
): WarehouseEventRow {
  return {
    event_date: event.context.session.occurredAt.slice(0, 10),
    event_timestamp: event.context.session.occurredAt,
    brand_id: event.context.brandId,
    event_name: event.name,
    session_id: event.context.session.sessionId,
    anonymous_id: event.context.user.anonymousId,
    user_id: event.context.user.userId,
    page_path: event.context.page?.path,
    traffic_source: event.context.attribution?.source,
    traffic_medium: event.context.attribution?.medium,
    traffic_campaign: event.context.attribution?.campaign,
    lead_score: leadScore.score,
    lead_temperature: leadScore.temperature,
    funnel_ids: funnelProgress.map((item) => item.funnelId),
    payload_json: JSON.stringify(event.payload),
    metadata_json: JSON.stringify(event.context.metadata),
  };
}

export const warehouseSqlArtifacts = {
  factMarketingEvents: `
CREATE TABLE IF NOT EXISTS marketing_intelligence.fact_marketing_events (
  event_date DATE NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  brand_id STRING NOT NULL,
  event_name STRING NOT NULL,
  session_id STRING NOT NULL,
  anonymous_id STRING NOT NULL,
  user_id STRING,
  page_path STRING,
  traffic_source STRING,
  traffic_medium STRING,
  traffic_campaign STRING,
  lead_score INT64,
  lead_temperature STRING,
  funnel_ids ARRAY<STRING>,
  payload_json JSON,
  metadata_json JSON
)
PARTITION BY event_date
CLUSTER BY brand_id, event_name, traffic_source;
`.trim(),
  factLeadScores: `
CREATE TABLE IF NOT EXISTS marketing_intelligence.fact_lead_scores (
  snapshot_date DATE NOT NULL,
  anonymous_id STRING NOT NULL,
  session_id STRING NOT NULL,
  score INT64 NOT NULL,
  temperature STRING NOT NULL,
  segments ARRAY<STRING>,
  last_event_at TIMESTAMP NOT NULL
)
PARTITION BY snapshot_date
CLUSTER BY temperature, session_id;
`.trim(),
};

