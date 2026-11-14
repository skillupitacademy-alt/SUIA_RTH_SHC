-- Shared execution requires separate owner authorization.
CREATE UNIQUE INDEX "uniq_users_email_platform" ON "public"."users" (LOWER(TRIM("email")), "platform") WHERE "deleted_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "public"."users" DROP CONSTRAINT "users_email_unique";
