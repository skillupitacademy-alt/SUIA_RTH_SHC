CREATE INDEX IF NOT EXISTS "idx_sso_sessions_family" ON "sso_sessions" USING btree ("jwt_family","revoked_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_subscriptions_user_active" ON "subscriptions" USING btree ("user_id","status") WHERE "status" = 'active';--> statement-breakpoint
