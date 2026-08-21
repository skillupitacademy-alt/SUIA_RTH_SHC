ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT "tutorial_sidebar_trees_v2_domain_id_tutorial_domains_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT "tutorial_sidebar_trees_v2_subject_id_tutorial_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT "tutorial_sidebar_trees_v2_topic_id_tutorial_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT "tutorial_sidebar_trees_v2_active_subtopic_id_tutorial_subtopics_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT "tutorial_page_content_v2_domain_id_tutorial_domains_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT "tutorial_page_content_v2_subject_id_tutorial_subjects_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT "tutorial_page_content_v2_topic_id_tutorial_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT "tutorial_page_content_v2_subtopic_id_tutorial_subtopics_id_fk";
--> statement-breakpoint
DROP INDEX "idx_sections_subtopic";--> statement-breakpoint
DROP INDEX "idx_sections_status";--> statement-breakpoint
DROP INDEX "idx_sections_type";--> statement-breakpoint
DROP INDEX "idx_sections_published";--> statement-breakpoint
DROP INDEX "idx_sections_delivery";--> statement-breakpoint
DROP INDEX "idx_sections_delivery_by_type";--> statement-breakpoint
DROP INDEX "idx_sections_brand";--> statement-breakpoint
DROP INDEX "idx_sections_architecture";--> statement-breakpoint
DROP INDEX "uq_section_subtopic_type_difficulty_brand";--> statement-breakpoint
CREATE INDEX "idx_tutorial_v2_delivery" ON "tutorial_sections" USING btree ("subtopic_id","brand_id","status");--> statement-breakpoint
CREATE INDEX "idx_tutorial_v2_by_brand" ON "tutorial_sections" USING btree ("brand_id","status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_tutorial_v2_by_status" ON "tutorial_sections" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "idx_tutorial_v2_by_architecture" ON "tutorial_sections" USING btree ("educational_architecture_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_v2_subtopic_status" ON "tutorial_sections" USING btree ("subtopic_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_v2_identity_active" ON "tutorial_sections" USING btree ("subtopic_id","brand_id") WHERE "tutorial_sections"."deleted_at" IS NULL;--> statement-breakpoint
ALTER TABLE "tutorial_sections" DROP COLUMN "section_type";--> statement-breakpoint
ALTER TABLE "tutorial_sections" DROP COLUMN "difficulty";