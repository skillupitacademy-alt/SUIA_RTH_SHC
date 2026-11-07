-- Offline migration artifact: 0009_student_invitations.sql
-- Purpose: Durable student invitation ledger for single-use expiring token provisioning and atomic account activation (Sol S3 / TC08 / FND11 / FND16).
-- Do NOT execute against live database without authorized physical migration gate.

CREATE TABLE IF NOT EXISTS "student_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "email" varchar(255) NOT NULL,
  "platform" "people_platform" DEFAULT 'skillup' NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "status" varchar(32) DEFAULT 'pending' NOT NULL,
  "claim_owner_token" varchar(120),
  "claim_expires_at" timestamp,
  "issued_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "redeemed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "student_invitations_token_hash_unq"
  ON "student_invitations" ("token_hash");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "student_invitations_user_platform_status_idx"
  ON "student_invitations" ("user_id", "platform", "status");
