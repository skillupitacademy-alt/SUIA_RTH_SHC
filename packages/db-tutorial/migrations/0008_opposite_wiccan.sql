CREATE TABLE "tutorial_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"domain_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_subtopics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"difficulty_levels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tutorial_subjects" ADD CONSTRAINT "tutorial_subjects_domain_id_tutorial_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."tutorial_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_topics" ADD CONSTRAINT "tutorial_topics_subject_id_tutorial_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."tutorial_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_subtopics" ADD CONSTRAINT "tutorial_subtopics_topic_id_tutorial_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."tutorial_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_domains_external_id" ON "tutorial_domains" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_domains_slug" ON "tutorial_domains" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subjects_external_id" ON "tutorial_subjects" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subjects_slug" ON "tutorial_subjects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tutorial_subjects_domain_id" ON "tutorial_subjects" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_topics_external_id" ON "tutorial_topics" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_topics_slug" ON "tutorial_topics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tutorial_topics_subject_id" ON "tutorial_topics" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subtopics_external_id" ON "tutorial_subtopics" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subtopics_slug" ON "tutorial_subtopics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tutorial_subtopics_topic_id" ON "tutorial_subtopics" USING btree ("topic_id");