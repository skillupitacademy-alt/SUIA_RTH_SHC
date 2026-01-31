CREATE TYPE "public"."mapping_type" AS ENUM('conceptual', 'technical', 'practical');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('technical', 'cognitive', 'process');--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "category" SET DATA TYPE skill_category;--> statement-breakpoint
ALTER TABLE "skills" ALTER COLUMN "mapping_type" SET DATA TYPE mapping_type;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "weight" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN "mapping_type" "mapping_type";