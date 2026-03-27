CREATE TYPE "public"."people_subscription_feature_key" AS ENUM('exam.unlimited', 'exam.basic', 'tutorial.full_access', 'tutorial.preview_only', 'ai_tutor', 'certificate', 'placement_matching', 'live_sessions');--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price_monthly" integer DEFAULT 0 NOT NULL,
	"price_yearly" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "subscription_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"feature_key" "people_subscription_feature_key" NOT NULL,
	"limit_value" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "user_features_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "subscription_features" ADD CONSTRAINT "subscription_features_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_features_cache" ADD CONSTRAINT "user_features_cache_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_subscription_plans_active" ON "subscription_plans" USING btree ("is_active","name");--> statement-breakpoint
CREATE INDEX "idx_subscription_features_plan" ON "subscription_features" USING btree ("plan_id","feature_key");--> statement-breakpoint
CREATE INDEX "idx_user_features_cache_user" ON "user_features_cache" USING btree ("user_id","cached_at");
