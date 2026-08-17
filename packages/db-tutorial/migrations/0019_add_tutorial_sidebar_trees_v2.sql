CREATE TABLE "tutorial_sidebar_trees_v2" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "brand_id" text NOT NULL,
  "domain_id" uuid NOT NULL,
  "subject_id" uuid NOT NULL,
  "topic_id" uuid NOT NULL,
  "active_subtopic_id" uuid,
  "tree" jsonb NOT NULL,
  "source_format" text DEFAULT 'json' NOT NULL,
  "source_content" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "version" integer DEFAULT 1 NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" ADD CONSTRAINT "tutorial_sidebar_trees_v2_domain_id_tutorial_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."tutorial_domains"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" ADD CONSTRAINT "tutorial_sidebar_trees_v2_subject_id_tutorial_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."tutorial_subjects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" ADD CONSTRAINT "tutorial_sidebar_trees_v2_topic_id_tutorial_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."tutorial_topics"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" ADD CONSTRAINT "tutorial_sidebar_trees_v2_active_subtopic_id_tutorial_subtopics_id_fk" FOREIGN KEY ("active_subtopic_id") REFERENCES "public"."tutorial_subtopics"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_tutorial_sidebar_trees_v2_scope" ON "tutorial_sidebar_trees_v2" USING btree ("brand_id", "domain_id", "subject_id", "topic_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_sidebar_trees_v2_scope" ON "tutorial_sidebar_trees_v2" USING btree ("brand_id", "topic_id");
