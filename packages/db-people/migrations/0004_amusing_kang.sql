CREATE INDEX IF NOT EXISTS "idx_users_email_platform" ON "users" USING btree ("email","platform") WHERE "users"."deleted_at" IS NULL;
