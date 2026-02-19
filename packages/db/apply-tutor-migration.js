const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sql = `
ALTER TYPE "public"."notification_type" ADD VALUE 'help_requested';
ALTER TYPE "public"."notification_type" ADD VALUE 'live_session_alert';
CREATE TABLE IF NOT EXISTS "tutor_help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"priority" text DEFAULT 'low' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_help_requests_user_id_users_id_fk') THEN
        ALTER TABLE "tutor_help_requests" ADD CONSTRAINT "tutor_help_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tutor_help_requests_topic_id_topics_id_fk') THEN
        ALTER TABLE "tutor_help_requests" ADD CONSTRAINT "tutor_help_requests_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS "idx_help_request_user" ON "tutor_help_requests" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_help_request_status" ON "tutor_help_requests" USING btree ("status");
`;

async function main() {
    console.log("Starting manual tutor migration...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("CONNECTED TO DATABASE");

        // We can't easily split by semicolon if we have DO blocks or complex strings,
        // but since our SQL is simple we'll try to execute it in chunks or as a whole.
        // For Postgres 'pg' client, we can actually pass multiple statements if not using params.

        console.log("Executing migration payload...");
        await client.query(sql);

        console.log("Migration applied successfully!");

    } catch (err) {
        console.error("MIGRATION_ERROR:", err.message);
        if (err.detail) console.error("DETAIL:", err.detail);
    } finally {
        await client.end();
    }
}
main();
