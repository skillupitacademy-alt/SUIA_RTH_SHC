-- Offline migration artifact: 0015_event_outbox.sql
-- Purpose: Durable transactional outbox / publication-intent ledger for worker downstream event recovery (Sol A2 / L3 / D7).
-- Do NOT execute against live database without authorized physical migration gate.

CREATE TABLE IF NOT EXISTS "event_outbox" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" varchar(50) NOT NULL,
  "event_type" varchar(120) NOT NULL,
  "event_id" uuid NOT NULL,
  "aggregate_id" varchar(180) NOT NULL,
  "payload" jsonb NOT NULL,
  "envelope" jsonb,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "owner_token" varchar(120),
  "lease_expires_at" timestamp,
  "last_error" text,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_outbox_tenant_event_aggregate_unq"
  ON "event_outbox" ("tenant_id", "event_type", "aggregate_id");

CREATE UNIQUE INDEX IF NOT EXISTS "event_outbox_event_id_unq"
  ON "event_outbox" ("event_id");

CREATE INDEX IF NOT EXISTS "event_outbox_status_idx"
  ON "event_outbox" ("tenant_id", "status", "created_at");
