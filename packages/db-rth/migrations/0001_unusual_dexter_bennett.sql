ALTER TABLE "users" ADD COLUMN "is_onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "primary_goal" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "domain" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sub_domain" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "time_commitment" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "journey_status" text;