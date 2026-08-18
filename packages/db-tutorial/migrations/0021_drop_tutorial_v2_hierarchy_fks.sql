ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_domain_id_tutorial_domains_id_fk";
ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_subject_id_tutorial_subjects_id_fk";
ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_topic_id_tutorial_topics_id_fk";
ALTER TABLE "tutorial_sidebar_trees_v2" DROP CONSTRAINT IF EXISTS "tutorial_sidebar_trees_v2_active_subtopic_id_tutorial_subtopics_id_fk";

ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_domain_id_tutorial_domains_id_fk";
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_subject_id_tutorial_subjects_id_fk";
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_topic_id_tutorial_topics_id_fk";
ALTER TABLE "tutorial_page_content_v2" DROP CONSTRAINT IF EXISTS "tutorial_page_content_v2_subtopic_id_tutorial_subtopics_id_fk";
