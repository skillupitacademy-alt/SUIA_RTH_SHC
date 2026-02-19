const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const sql = `
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topics' AND column_name='learning_url') THEN
        ALTER TABLE "topics" ADD COLUMN "learning_url" text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='topics' AND column_name='detailed_notes_path') THEN
        ALTER TABLE "topics" ADD COLUMN "detailed_notes_path" text;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notifications_user_id_users_id_fk') THEN
        ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" USING btree ("is_read");
`;

async function main() {
    console.log("Starting manual migration...");
    const client = new Client({ 
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        await client.connect();
        console.log("CONNECTED TO DATABASE");

        // Split by semicolon and run each statement
        const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        
        for (const statement of statements) {
            console.log("Executing:", statement.substring(0, 50) + "...");
            await client.query(statement);
        }

        console.log("Migration applied successfully!");

    } catch (err) {
        console.error("MIGRATION_ERROR:", err.message);
        if (err.detail) console.error("DETAIL:", err.detail);
    } finally {
        await client.end();
    }
}
main();
