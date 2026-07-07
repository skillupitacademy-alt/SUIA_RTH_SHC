CREATE TYPE "public"."domain_category" AS ENUM('academic', 'professional', 'technical', 'creative', 'life_skills');--> statement-breakpoint
CREATE TYPE "public"."skill_category" AS ENUM('technical', 'soft', 'analytical', 'creative', 'managerial', 'communication');--> statement-breakpoint
CREATE TYPE "public"."entity_status" AS ENUM('draft', 'active', 'archived', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."topic_complexity" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "domain_category" NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "skill_category" NOT NULL,
	"weight" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "subtopics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"depth" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "topic_skills" (
	"topic_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"relevance" numeric(3, 2) DEFAULT '0.50' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "topic_skills_topic_id_skill_id_pk" PRIMARY KEY("topic_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"complexity" "topic_complexity" DEFAULT 'beginner' NOT NULL,
	"weight" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"status" "entity_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subtopics" ADD CONSTRAINT "subtopics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_skills" ADD CONSTRAINT "topic_skills_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_skills" ADD CONSTRAINT "topic_skills_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "domains_name_unique" ON "domains" USING btree ("name");--> statement-breakpoint
CREATE INDEX "domains_category_idx" ON "domains" USING btree ("category");--> statement-breakpoint
CREATE INDEX "domains_status_idx" ON "domains" USING btree ("status");--> statement-breakpoint
CREATE INDEX "domains_order_idx" ON "domains" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_name_unique" ON "skills" USING btree ("name");--> statement-breakpoint
CREATE INDEX "skills_category_idx" ON "skills" USING btree ("category");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "subjects_domain_name_unique" ON "subjects" USING btree ("domain_id","name");--> statement-breakpoint
CREATE INDEX "subjects_domain_idx" ON "subjects" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "subjects_status_idx" ON "subjects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subjects_order_idx" ON "subjects" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "subtopics_topic_name_unique" ON "subtopics" USING btree ("topic_id","name");--> statement-breakpoint
CREATE INDEX "subtopics_topic_idx" ON "subtopics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "subtopics_depth_idx" ON "subtopics" USING btree ("depth");--> statement-breakpoint
CREATE INDEX "subtopics_status_idx" ON "subtopics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subtopics_order_idx" ON "subtopics" USING btree ("order");--> statement-breakpoint
CREATE INDEX "topic_skills_topic_idx" ON "topic_skills" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "topic_skills_skill_idx" ON "topic_skills" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "topics_subject_name_unique" ON "topics" USING btree ("subject_id","name");--> statement-breakpoint
CREATE INDEX "topics_subject_idx" ON "topics" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "topics_complexity_idx" ON "topics" USING btree ("complexity");--> statement-breakpoint
CREATE INDEX "topics_status_idx" ON "topics" USING btree ("status");--> statement-breakpoint
CREATE INDEX "topics_order_idx" ON "topics" USING btree ("order");