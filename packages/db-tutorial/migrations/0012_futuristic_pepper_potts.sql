CREATE TYPE "public"."brand" AS ENUM('realtutorialhub', 'skillup', 'shared');--> statement-breakpoint
CREATE TYPE "public"."brand_visibility" AS ENUM('brand_exclusive', 'shared_visible', 'white_label');--> statement-breakpoint
CREATE TYPE "public"."deployment_type" AS ENUM('full', 'staged', 'canary', 'ab_test', 'dark_launch');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('pending', 'running', 'validating', 'completed', 'failed', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."orchestration_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."priority_level" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending_review', 'in_review', 'approved', 'rejected', 'changes_requested');--> statement-breakpoint
CREATE TYPE "public"."section_status" AS ENUM('draft', 'generating', 'validating', 'pending_review', 'in_review', 'changes_requested', 'approved', 'deploying', 'deployed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('notes', 'layman', 'visual', 'real_life', 'technical', 'code', 'practice', 'assignment', 'project', 'quiz', 'summary', 'interview');--> statement-breakpoint
CREATE TYPE "public"."subsection_type" AS ENUM('definition', 'concept', 'syntax', 'analogy', 'example', 'visual', 'diagram', 'animation', 'pitfall', 'antipattern', 'gotcha', 'code', 'exercise', 'challenge', 'sandbox', 'checklist', 'cheatsheet', 'faq', 'glossary', 'interview_question', 'quiz_question', 'project_step', 'project_milestone', 'project_deliverable');--> statement-breakpoint
CREATE TYPE "public"."assignment_help_request_status" AS ENUM('open', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."assignment_progress_status" AS ENUM('not_started', 'in_progress', 'self_completed');--> statement-breakpoint
CREATE TYPE "public"."assignment_question_type" AS ENUM('mcq', 'short_answer', 'code', 'open_ended');--> statement-breakpoint
CREATE TYPE "public"."live_session_request_status" AS ENUM('pending', 'accepted', 'scheduled', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."tutorial_content_audit_action" AS ENUM('created', 'updated', 'published', 'unpublished', 'restored');--> statement-breakpoint
CREATE TYPE "public"."tutorial_content_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tutorial_deliverable_type" AS ENUM('code', 'repo', 'live_demo', 'document');--> statement-breakpoint
CREATE TYPE "public"."tutorial_difficulty" AS ENUM('simple', 'mixed', 'intermediate', 'expert');--> statement-breakpoint
CREATE TYPE "public"."tutorial_evaluation_type" AS ENUM('auto', 'ai_review', 'peer_review', 'admin_review');--> statement-breakpoint
CREATE TYPE "public"."tutorial_progress_status" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."tutorial_project_level" AS ENUM('simple', 'intermediate', 'expert');--> statement-breakpoint
CREATE TYPE "public"."tutorial_project_scope" AS ENUM('topic', 'subject', 'domain');--> statement-breakpoint
CREATE TYPE "public"."tutorial_project_submission_status" AS ENUM('pending', 'submitted', 'ai_reviewing', 'needs_review', 'approved', 'revision_needed', 'graded', 'revision-requested');--> statement-breakpoint
CREATE TYPE "public"."tutorial_question_type" AS ENUM('mcq', 'short_answer', 'code', 'drag_drop', 'fill_blank');--> statement-breakpoint
CREATE TYPE "public"."tutorial_trigger_status" AS ENUM('pending', 'accepted', 'dismissed', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tutorial_video_provider" AS ENUM('youtube', 'vimeo', 'custom', 'loom');--> statement-breakpoint
CREATE TYPE "public"."layman_audit_action" AS ENUM('prompt_generated', 'prompt_exported', 'prompt_copied', 'prompt_modified', 'content_ingested', 'content_parsed', 'content_validated', 'content_revised', 'content_sanitized', 'section_created', 'section_updated', 'section_submitted_review', 'section_approved', 'section_rejected', 'section_published', 'section_archived', 'section_restored', 'validation_passed', 'validation_failed', 'quality_score_calculated', 'hallucination_detected', 'tamper_detected', 'sanitization_applied', 'rollback_executed');--> statement-breakpoint
CREATE TABLE "ai_generation_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer,
	"aggregation_level" text NOT NULL,
	"total_generations" integer DEFAULT 0 NOT NULL,
	"successful_generations" integer DEFAULT 0 NOT NULL,
	"failed_generations" integer DEFAULT 0 NOT NULL,
	"validation_pass_rate" integer DEFAULT 0 NOT NULL,
	"average_quality_score" integer DEFAULT 0 NOT NULL,
	"average_hallucination_score" integer DEFAULT 0 NOT NULL,
	"hallucination_incidents" integer DEFAULT 0 NOT NULL,
	"approval_rate" integer DEFAULT 0 NOT NULL,
	"average_review_time_minutes" integer DEFAULT 0 NOT NULL,
	"average_generation_time_ms" integer DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" integer DEFAULT 0 NOT NULL,
	"provider_breakdown" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_generation_orchestration" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"educational_architecture_id" uuid NOT NULL,
	"status" "orchestration_status" DEFAULT 'pending' NOT NULL,
	"sections_to_generate" jsonb NOT NULL,
	"sections_generated" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sections_failed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_sections" integer NOT NULL,
	"completed_sections" integer DEFAULT 0 NOT NULL,
	"failed_sections" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"estimated_completion_at" timestamp,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" integer DEFAULT 0 NOT NULL,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"brand_id" "brand" DEFAULT 'shared' NOT NULL,
	"initiated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_section_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orchestration_id" uuid NOT NULL,
	"section_type" "section_type" NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"prompt_version" integer NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt" text NOT NULL,
	"prompt_variables" jsonb NOT NULL,
	"ai_provider" text NOT NULL,
	"model_name" text NOT NULL,
	"temperature" integer DEFAULT 70 NOT NULL,
	"max_tokens" integer DEFAULT 4000 NOT NULL,
	"status" "job_status" DEFAULT 'pending' NOT NULL,
	"raw_output" text,
	"parsed_output" jsonb,
	"validation_status" text,
	"validation_errors" jsonb,
	"validation_warnings" jsonb,
	"quality_score" integer,
	"hallucination_score" integer,
	"hallucination_flags" jsonb,
	"tokens_used" integer,
	"cost_usd" integer,
	"generation_time_ms" integer,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "educational_architecture_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"aggregation_level" text NOT NULL,
	"architecture_id" uuid NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_usages" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"average_completion_rate" integer DEFAULT 0 NOT NULL,
	"average_time_to_complete" integer DEFAULT 0 NOT NULL,
	"average_quiz_score" integer,
	"average_assignment_score" integer,
	"average_engagement_score" integer DEFAULT 0 NOT NULL,
	"retention_rate" integer DEFAULT 0 NOT NULL,
	"satisfaction_score" integer,
	"recommendation_rate" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompt_template_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"aggregation_level" text NOT NULL,
	"template_id" uuid NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_generations" integer DEFAULT 0 NOT NULL,
	"successful_generations" integer DEFAULT 0 NOT NULL,
	"failed_generations" integer DEFAULT 0 NOT NULL,
	"average_quality_score" integer DEFAULT 0 NOT NULL,
	"average_hallucination_score" integer DEFAULT 0 NOT NULL,
	"validation_pass_rate" integer DEFAULT 0 NOT NULL,
	"approval_rate" integer DEFAULT 0 NOT NULL,
	"average_review_time" integer DEFAULT 0 NOT NULL,
	"regeneration_rate" integer DEFAULT 0 NOT NULL,
	"total_tokens_used" integer DEFAULT 0 NOT NULL,
	"total_cost_usd" integer DEFAULT 0 NOT NULL,
	"average_cost_per_generation" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ui_architecture_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"aggregation_level" text NOT NULL,
	"architecture_id" uuid NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_renders" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"average_load_time" integer DEFAULT 0 NOT NULL,
	"average_render_time" integer DEFAULT 0 NOT NULL,
	"error_rate" integer DEFAULT 0 NOT NULL,
	"bounce_rate" integer DEFAULT 0 NOT NULL,
	"average_session_duration" integer DEFAULT 0 NOT NULL,
	"interaction_rate" integer DEFAULT 0 NOT NULL,
	"accessibility_score" integer,
	"screen_reader_usage" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brand_performance_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"aggregation_level" text NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"churned_users" integer DEFAULT 0 NOT NULL,
	"average_sessions_per_user" integer DEFAULT 0 NOT NULL,
	"average_session_duration" integer DEFAULT 0 NOT NULL,
	"total_content_views" integer DEFAULT 0 NOT NULL,
	"tutorials_started" integer DEFAULT 0 NOT NULL,
	"tutorials_completed" integer DEFAULT 0 NOT NULL,
	"average_completion_rate" integer DEFAULT 0 NOT NULL,
	"certificates_issued" integer DEFAULT 0 NOT NULL,
	"day_one_retention" integer DEFAULT 0 NOT NULL,
	"day_seven_retention" integer DEFAULT 0 NOT NULL,
	"day_thirty_retention" integer DEFAULT 0 NOT NULL,
	"free_to_pro_conversions" integer DEFAULT 0 NOT NULL,
	"conversion_rate" integer DEFAULT 0 NOT NULL,
	"total_revenue" integer DEFAULT 0 NOT NULL,
	"subscription_revenue" integer DEFAULT 0 NOT NULL,
	"average_revenue_per_user" integer DEFAULT 0 NOT NULL,
	"nps_score" integer,
	"average_satisfaction_score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deployment_cohort_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"aggregation_level" text NOT NULL,
	"deployment_id" uuid NOT NULL,
	"cohort_name" text NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_users" integer DEFAULT 0 NOT NULL,
	"active_users" integer DEFAULT 0 NOT NULL,
	"average_completion_rate" integer DEFAULT 0 NOT NULL,
	"average_engagement_score" integer DEFAULT 0 NOT NULL,
	"average_time_spent" integer DEFAULT 0 NOT NULL,
	"control_group_completion_rate" integer,
	"lift_vs_control" integer,
	"conversion_rate" integer DEFAULT 0 NOT NULL,
	"revenue_impact" integer DEFAULT 0 NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"confidence_level" integer,
	"is_statistically_significant" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "revenue_attribution_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"aggregation_level" text NOT NULL,
	"brand_id" "brand" NOT NULL,
	"attribution_source" text NOT NULL,
	"attribution_id" uuid,
	"direct_revenue" integer DEFAULT 0 NOT NULL,
	"assisted_revenue" integer DEFAULT 0 NOT NULL,
	"total_attributed_revenue" integer DEFAULT 0 NOT NULL,
	"conversions" integer DEFAULT 0 NOT NULL,
	"conversion_rate" integer DEFAULT 0 NOT NULL,
	"average_touchpoints" integer DEFAULT 0 NOT NULL,
	"average_time_to_conversion" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subsection_engagement_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer,
	"aggregation_level" text NOT NULL,
	"subsection_id" uuid,
	"subsection_type" text NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"average_time_spent" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"scroll_depth" integer DEFAULT 0 NOT NULL,
	"interaction_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_learning_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"hour" integer,
	"aggregation_level" text NOT NULL,
	"section_id" uuid,
	"section_type" text NOT NULL,
	"brand_id" "brand" NOT NULL,
	"total_views" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"average_time_spent" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"started_count" integer DEFAULT 0 NOT NULL,
	"completed_count" integer DEFAULT 0 NOT NULL,
	"abandoned_count" integer DEFAULT 0 NOT NULL,
	"drop_off_points" jsonb,
	"code_executions" integer DEFAULT 0 NOT NULL,
	"practice_attempts" integer DEFAULT 0 NOT NULL,
	"quiz_attempts" integer DEFAULT 0 NOT NULL,
	"average_quiz_score" integer,
	"thumbs_up" integer DEFAULT 0 NOT NULL,
	"thumbs_down" integer DEFAULT 0 NOT NULL,
	"reported_issues" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assignment_help_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"question" text NOT NULL,
	"status" "assignment_help_request_status" DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"resolved_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assignment_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"status" "assignment_progress_status" DEFAULT 'not_started' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"level" "tutorial_project_level",
	"scope" "tutorial_project_scope",
	"criteria" jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" "tutorial_project_scope" NOT NULL,
	"parent_id" uuid NOT NULL,
	"parent_name" text NOT NULL,
	"verification_code" text NOT NULL,
	"pdf_url" text,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "content_deployments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"deployment_type" "deployment_type" DEFAULT 'full' NOT NULL,
	"target_audience" jsonb,
	"rollout_percentage" integer DEFAULT 100 NOT NULL,
	"experiment_id" uuid,
	"variant_name" text,
	"rollback_version" integer,
	"can_rollback" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"brand_id" "brand" NOT NULL,
	"brand_targets" jsonb,
	"impressions" integer DEFAULT 0 NOT NULL,
	"completion_rate" integer DEFAULT 0 NOT NULL,
	"feedback_score" integer,
	"error_rate" integer,
	"deployed_at" timestamp,
	"completed_at" timestamp,
	"rolled_back_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"status" "tutorial_content_job_status" DEFAULT 'pending' NOT NULL,
	"prompt_version" integer DEFAULT 1 NOT NULL,
	"prompt" jsonb,
	"result" jsonb,
	"error" text,
	"generated_by" uuid,
	"processed_at" timestamp,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "content_review_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"orchestration_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp,
	"status" "review_status" DEFAULT 'pending_review' NOT NULL,
	"review_comments" text,
	"rejection_reason" text,
	"suggested_changes" jsonb,
	"reviewer_quality_score" integer,
	"reviewer_flags" jsonb,
	"review_started_at" timestamp,
	"review_completed_at" timestamp,
	"priority" "priority_level" DEFAULT 'normal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "domain_content_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain_id" uuid NOT NULL,
	"audience_profile" text NOT NULL,
	"default_language" text DEFAULT 'en' NOT NULL,
	"seo_title_template" text,
	"ai_tutor_enabled" boolean DEFAULT true NOT NULL,
	"content_review_required" boolean DEFAULT true NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "educational_architectures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"target_audience" jsonb NOT NULL,
	"target_domains" jsonb,
	"section_sequence" jsonb NOT NULL,
	"interactivity_level" text DEFAULT 'medium' NOT NULL,
	"visual_density" text DEFAULT 'medium' NOT NULL,
	"brand_id" "brand" DEFAULT 'shared' NOT NULL,
	"brand_visibility" "brand_visibility" DEFAULT 'shared_visible' NOT NULL,
	"brand_overrides" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "educational_architectures_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tutorial_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"section_type" "section_type" NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"status" "section_status" DEFAULT 'draft' NOT NULL,
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"ai_model_used" text,
	"generation_job_id" uuid,
	"quality_score" integer,
	"hallucination_score" integer,
	"regeneration_count" integer DEFAULT 0 NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"prompt_template_id" uuid,
	"educational_architecture_id" uuid,
	"ui_architecture_id" uuid,
	"brand_id" "brand" DEFAULT 'shared' NOT NULL,
	"brand_visibility" "brand_visibility" DEFAULT 'shared_visible' NOT NULL,
	"brand_customizations" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tutorial_subsections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"subsection_type" "subsection_type" NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"content" jsonb NOT NULL,
	"estimated_read_time" integer,
	"complexity_level" integer DEFAULT 1 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"brand_id" "brand" DEFAULT 'shared' NOT NULL,
	"brand_visibility" "brand_visibility" DEFAULT 'shared_visible' NOT NULL,
	"brand_customizations" jsonb,
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"prompt_template_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "code_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"code_example_id" text NOT NULL,
	"user_code" text NOT NULL,
	"executed" boolean DEFAULT false NOT NULL,
	"execution_result" jsonb,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_test_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"selected_answer" text NOT NULL,
	"correct_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"feedback_viewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"question_id" text NOT NULL,
	"selected_answer" text NOT NULL,
	"correct_answer" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"subsection_id" uuid,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"score" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visual_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"component_id" text NOT NULL,
	"interaction_type" text NOT NULL,
	"interaction_data" jsonb,
	"time_spent" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ui_architectures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"section_renderers" jsonb NOT NULL,
	"responsive_breakpoints" jsonb,
	"accessibility_profile" text DEFAULT 'standard' NOT NULL,
	"brand_id" "brand" DEFAULT 'shared' NOT NULL,
	"brand_visibility" "brand_visibility" DEFAULT 'shared_visible' NOT NULL,
	"brand_compatibility" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ui_architectures_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "prompt_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_type" "section_type" NOT NULL,
	"subsection_type" "subsection_type",
	"name" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt_template" text NOT NULL,
	"variables" jsonb NOT NULL,
	"output_schema" jsonb NOT NULL,
	"validation_rules" jsonb,
	"success_criteria" jsonb,
	"model_name" text DEFAULT 'gpt-4' NOT NULL,
	"temperature" integer DEFAULT 70 NOT NULL,
	"max_tokens" integer DEFAULT 4000 NOT NULL,
	"brand_id" "brand" DEFAULT 'shared' NOT NULL,
	"brand_visibility" "brand_visibility" DEFAULT 'shared_visible' NOT NULL,
	"brand_variants" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"success_rate" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layman_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid,
	"prompt_id" uuid,
	"action" "layman_audit_action" NOT NULL,
	"action_category" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"user_role" varchar(50),
	"brand_id" varchar(50) NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"diff" jsonb,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"success" varchar(20) DEFAULT 'success' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layman_prompt_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid,
	"subtopic_id" uuid NOT NULL,
	"prompt_template_id" uuid NOT NULL,
	"template_name" varchar(255) NOT NULL,
	"template_version" varchar(50) NOT NULL,
	"system_prompt" text NOT NULL,
	"user_prompt" text NOT NULL,
	"full_prompt" text NOT NULL,
	"variables" jsonb NOT NULL,
	"prompt_hash" varchar(64) NOT NULL,
	"prompt_signature" text,
	"brand_id" varchar(50) NOT NULL,
	"educational_architecture_id" uuid,
	"educational_architecture_name" varchar(255),
	"ui_architecture_id" uuid,
	"ui_architecture_name" varchar(255),
	"was_used" varchar(20) DEFAULT 'pending' NOT NULL,
	"used_at" timestamp,
	"export_count" integer DEFAULT 0 NOT NULL,
	"last_exported_at" timestamp,
	"export_format" varchar(50),
	"metadata" jsonb,
	"generated_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "layman_content_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"parent_revision_id" uuid,
	"content" jsonb NOT NULL,
	"quality_score" integer,
	"hallucination_risk" integer,
	"completeness_score" integer,
	"validation_errors" jsonb,
	"validation_warnings" jsonb,
	"status" varchar(50) NOT NULL,
	"governance_status" varchar(50),
	"change_type" varchar(50) NOT NULL,
	"change_reason" text,
	"changed_subsections" jsonb,
	"source_prompt_id" uuid,
	"ai_response_raw" text,
	"brand_id" varchar(50) NOT NULL,
	"metadata" jsonb,
	"created_by" uuid NOT NULL,
	"created_by_role" varchar(50),
	"is_current_version" varchar(10) DEFAULT 'yes' NOT NULL,
	"replaced_at" timestamp,
	"replaced_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"content_type" text DEFAULT 'standard' NOT NULL,
	"content" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"generated_by_ai" boolean DEFAULT false NOT NULL,
	"ai_model_used" text,
	"generation_job_id" uuid,
	"admin_approved_by" uuid,
	"admin_approved_at" timestamp,
	"quality_score" jsonb,
	"regeneration_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
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
CREATE TABLE "tutorial_content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"saved_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_content_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "tutorial_content_audit_action" NOT NULL,
	"diff" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"question_type" "assignment_question_type" NOT NULL,
	"question" text DEFAULT '' NOT NULL,
	"hints" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reference_answer" text DEFAULT '' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"content" jsonb NOT NULL,
	"order_index" integer,
	"points" integer DEFAULT 10 NOT NULL,
	"time_limit_sec" integer,
	"is_published" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "live_session_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"doubt_text" text,
	"status" "live_session_request_status" DEFAULT 'pending' NOT NULL,
	"faculty_id" uuid,
	"meeting_link" text,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"cancelled_reason" text,
	"deleted_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
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
CREATE TABLE "tutorial_projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "tutorial_project_scope" NOT NULL,
	"parent_id" uuid NOT NULL,
	"level" "tutorial_project_level" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"deliverable_type" "tutorial_deliverable_type" NOT NULL,
	"evaluation_type" "tutorial_evaluation_type" NOT NULL,
	"estimated_hours" integer,
	"badge_id" uuid,
	"subtopics_covered" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"prerequisites" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tutorial_project_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"project_level" "tutorial_project_level" NOT NULL,
	"difficulty" "tutorial_difficulty" NOT NULL,
	"submission_content" jsonb NOT NULL,
	"status" "tutorial_project_submission_status" DEFAULT 'pending' NOT NULL,
	"score" integer,
	"feedback" text,
	"ai_review" jsonb DEFAULT 'null'::jsonb,
	"peer_reviews" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"admin_review" jsonb DEFAULT 'null'::jsonb,
	"badge_awarded" boolean DEFAULT false NOT NULL,
	"video_required" boolean DEFAULT false NOT NULL,
	"video_url" text,
	"submitted_at" timestamp,
	"graded_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_id" uuid NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL,
	"project_submission_id" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tutorial_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"status" "tutorial_progress_status" DEFAULT 'not_started' NOT NULL,
	"blocks_completed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"remediation_triggered" boolean DEFAULT false NOT NULL,
	"score" numeric(5, 2),
	"time_spent_sec" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tutorial_video_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subtopic_id" uuid,
	"project_id" uuid,
	"assignment_difficulty" "tutorial_difficulty",
	"provider" "tutorial_video_provider" NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"thumbnail_url" text,
	"duration_seconds" integer,
	"captions_available" boolean DEFAULT false NOT NULL,
	"approved_by_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "remediation_triggers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_result_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"weak_subtopics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weak_subtopic_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"recommended_content_types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "tutorial_trigger_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subtopic_flow_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subtopic_id" uuid NOT NULL,
	"layman_read_at" timestamp,
	"real_life_read_at" timestamp,
	"technical_read_at" timestamp,
	"code_read_at" timestamp,
	"ai_tutor_first_message_at" timestamp,
	"assignment_unlocked_at" timestamp,
	"assignment_completed_at" timestamp,
	"current_flow_step" integer DEFAULT 1 NOT NULL,
	"flow_completed" boolean DEFAULT false NOT NULL,
	"time_on_layman_seconds" integer DEFAULT 0 NOT NULL,
	"time_on_technical_seconds" integer DEFAULT 0 NOT NULL,
	"time_on_code_seconds" integer DEFAULT 0 NOT NULL,
	"total_time_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student_streaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity" timestamp,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"level" text DEFAULT 'bronze' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ai_generation_orchestration" ADD CONSTRAINT "ai_generation_orchestration_subtopic_id_tutorial_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."tutorial_subtopics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_orchestration" ADD CONSTRAINT "ai_generation_orchestration_educational_architecture_id_educational_architectures_id_fk" FOREIGN KEY ("educational_architecture_id") REFERENCES "public"."educational_architectures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_section_generation_jobs" ADD CONSTRAINT "ai_section_generation_jobs_orchestration_id_ai_generation_orchestration_id_fk" FOREIGN KEY ("orchestration_id") REFERENCES "public"."ai_generation_orchestration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_architecture_performance" ADD CONSTRAINT "educational_architecture_performance_architecture_id_educational_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."educational_architectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_template_performance" ADD CONSTRAINT "prompt_template_performance_template_id_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_architecture_performance" ADD CONSTRAINT "ui_architecture_performance_architecture_id_ui_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."ui_architectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subsection_engagement_metrics" ADD CONSTRAINT "subsection_engagement_metrics_subsection_id_tutorial_subsections_id_fk" FOREIGN KEY ("subsection_id") REFERENCES "public"."tutorial_subsections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_learning_metrics" ADD CONSTRAINT "tutorial_learning_metrics_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_help_requests" ADD CONSTRAINT "assignment_help_requests_assignment_id_tutorial_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."tutorial_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_deployments" ADD CONSTRAINT "content_deployments_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_sections" ADD CONSTRAINT "tutorial_sections_subtopic_id_tutorial_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."tutorial_subtopics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_sections" ADD CONSTRAINT "tutorial_sections_prompt_template_id_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_sections" ADD CONSTRAINT "tutorial_sections_educational_architecture_id_educational_architectures_id_fk" FOREIGN KEY ("educational_architecture_id") REFERENCES "public"."educational_architectures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_sections" ADD CONSTRAINT "tutorial_sections_ui_architecture_id_ui_architectures_id_fk" FOREIGN KEY ("ui_architecture_id") REFERENCES "public"."ui_architectures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_subsections" ADD CONSTRAINT "tutorial_subsections_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_subsections" ADD CONSTRAINT "tutorial_subsections_prompt_template_id_prompt_templates_id_fk" FOREIGN KEY ("prompt_template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "code_interactions" ADD CONSTRAINT "code_interactions_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_test_answers" ADD CONSTRAINT "practice_test_answers_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section_completions" ADD CONSTRAINT "section_completions_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visual_interactions" ADD CONSTRAINT "visual_interactions_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_subjects" ADD CONSTRAINT "tutorial_subjects_domain_id_tutorial_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."tutorial_domains"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_topics" ADD CONSTRAINT "tutorial_topics_subject_id_tutorial_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."tutorial_subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_subtopics" ADD CONSTRAINT "tutorial_subtopics_topic_id_tutorial_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."tutorial_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_project_submissions" ADD CONSTRAINT "tutorial_project_submissions_project_id_tutorial_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tutorial_projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_badge_id_badges_id_fk" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_badges" ADD CONSTRAINT "student_badges_project_submission_id_tutorial_project_submissions_id_fk" FOREIGN KEY ("project_submission_id") REFERENCES "public"."tutorial_project_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_metrics_date_hour_level" ON "ai_generation_metrics" USING btree ("date","hour","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_orchestration_status" ON "ai_generation_orchestration" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orchestration_subtopic" ON "ai_generation_orchestration" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_orchestration_initiator" ON "ai_generation_orchestration" USING btree ("initiated_by");--> statement-breakpoint
CREATE INDEX "idx_orchestration_brand" ON "ai_generation_orchestration" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_orchestration_architecture" ON "ai_generation_orchestration" USING btree ("educational_architecture_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_orchestration" ON "ai_section_generation_jobs" USING btree ("orchestration_id");--> statement-breakpoint
CREATE INDEX "idx_jobs_status" ON "ai_section_generation_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_jobs_section" ON "ai_section_generation_jobs" USING btree ("section_type");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_educational_perf_date_arch_brand" ON "educational_architecture_performance" USING btree ("date","architecture_id","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_educational_perf_arch" ON "educational_architecture_performance" USING btree ("architecture_id");--> statement-breakpoint
CREATE INDEX "idx_educational_perf_brand" ON "educational_architecture_performance" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_prompt_perf_date_template_brand" ON "prompt_template_performance" USING btree ("date","template_id","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_prompt_perf_template" ON "prompt_template_performance" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_perf_brand" ON "prompt_template_performance" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ui_perf_date_arch_brand" ON "ui_architecture_performance" USING btree ("date","architecture_id","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_ui_perf_arch" ON "ui_architecture_performance" USING btree ("architecture_id");--> statement-breakpoint
CREATE INDEX "idx_ui_perf_brand" ON "ui_architecture_performance" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_brand_perf_date_brand" ON "brand_performance_metrics" USING btree ("date","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_brand_perf_brand" ON "brand_performance_metrics" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_brand_perf_date" ON "brand_performance_metrics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_deployment_cohort_date_brand" ON "deployment_cohort_metrics" USING btree ("date","deployment_id","cohort_name","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_deployment_cohort" ON "deployment_cohort_metrics" USING btree ("deployment_id");--> statement-breakpoint
CREATE INDEX "idx_deployment_brand" ON "deployment_cohort_metrics" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_revenue_attr_date_source_brand" ON "revenue_attribution_metrics" USING btree ("date","attribution_source","attribution_id","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_revenue_attr_brand" ON "revenue_attribution_metrics" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_revenue_attr_source" ON "revenue_attribution_metrics" USING btree ("attribution_source");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_subsection_metrics_date_hour_subsection_brand" ON "subsection_engagement_metrics" USING btree ("date","hour","subsection_id","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_subsection_engagement" ON "subsection_engagement_metrics" USING btree ("subsection_id");--> statement-breakpoint
CREATE INDEX "idx_subsection_brand" ON "subsection_engagement_metrics" USING btree ("brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_learning_metrics_date_hour_section_brand" ON "tutorial_learning_metrics" USING btree ("date","hour","section_id","brand_id","aggregation_level");--> statement-breakpoint
CREATE INDEX "idx_learning_section" ON "tutorial_learning_metrics" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_learning_brand" ON "tutorial_learning_metrics" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_learning_date" ON "tutorial_learning_metrics" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_assignment_help_request_user_assignment" ON "assignment_help_requests" USING btree ("user_id","assignment_id","subtopic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_assignment_progress_user_subtopic_difficulty" ON "assignment_progress" USING btree ("user_id","subtopic_id","difficulty");--> statement-breakpoint
CREATE INDEX "idx_badges_scope" ON "badges" USING btree ("scope","level");--> statement-breakpoint
CREATE INDEX "idx_certificates_user" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_certificates_verify" ON "certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "idx_deployments_section" ON "content_deployments" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_deployments_status" ON "content_deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deployments_experiment" ON "content_deployments" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "idx_deployments_brand" ON "content_deployments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_content_generation_jobs_subtopic" ON "content_generation_jobs" USING btree ("subtopic_id","status");--> statement-breakpoint
CREATE INDEX "idx_review_queue_status" ON "content_review_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_queue_assigned" ON "content_review_queue" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_review_queue_priority" ON "content_review_queue" USING btree ("priority","status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_domain_content_config_domain" ON "domain_content_config" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "idx_domain_content_config_domain" ON "domain_content_config" USING btree ("domain_id","default_language");--> statement-breakpoint
CREATE INDEX "idx_educational_brand" ON "educational_architectures" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_educational_active" ON "educational_architectures" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_sections_subtopic" ON "tutorial_sections" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_sections_status" ON "tutorial_sections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_sections_type" ON "tutorial_sections" USING btree ("section_type");--> statement-breakpoint
CREATE INDEX "idx_sections_published" ON "tutorial_sections" USING btree ("subtopic_id","status");--> statement-breakpoint
CREATE INDEX "idx_sections_brand" ON "tutorial_sections" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_sections_architecture" ON "tutorial_sections" USING btree ("educational_architecture_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_section_subtopic_type_difficulty_brand" ON "tutorial_sections" USING btree ("subtopic_id","section_type","difficulty","brand_id");--> statement-breakpoint
CREATE INDEX "idx_subsections_section" ON "tutorial_subsections" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_subsections_order" ON "tutorial_subsections" USING btree ("section_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_subsections_type" ON "tutorial_subsections" USING btree ("subsection_type");--> statement-breakpoint
CREATE INDEX "idx_subsections_brand" ON "tutorial_subsections" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_code_interactions_user" ON "code_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_code_interactions_section" ON "code_interactions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_code_interactions_example" ON "code_interactions" USING btree ("code_example_id");--> statement-breakpoint
CREATE INDEX "idx_practice_test_answers_user" ON "practice_test_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_practice_test_answers_section" ON "practice_test_answers" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_practice_test_answers_question" ON "practice_test_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_answers_user" ON "quiz_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_answers_section" ON "quiz_answers" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_quiz_answers_question" ON "quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_section_completions_user" ON "section_completions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_section_completions_section" ON "section_completions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_section_completions_subsection" ON "section_completions" USING btree ("subsection_id");--> statement-breakpoint
CREATE INDEX "idx_visual_interactions_user" ON "visual_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_visual_interactions_section" ON "visual_interactions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_visual_interactions_component" ON "visual_interactions" USING btree ("component_id");--> statement-breakpoint
CREATE INDEX "idx_ui_brand" ON "ui_architectures" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_ui_active" ON "ui_architectures" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_prompt_section_subsection_version_brand" ON "prompt_templates" USING btree ("section_type","subsection_type","version","brand_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_brand" ON "prompt_templates" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_prompt_section" ON "prompt_templates" USING btree ("section_type");--> statement-breakpoint
CREATE INDEX "idx_prompt_subsection" ON "prompt_templates" USING btree ("subsection_type");--> statement-breakpoint
CREATE INDEX "idx_layman_audit_section_id" ON "layman_audit_logs" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_layman_audit_prompt_id" ON "layman_audit_logs" USING btree ("prompt_id");--> statement-breakpoint
CREATE INDEX "idx_layman_audit_user_id" ON "layman_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_layman_audit_action" ON "layman_audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_layman_audit_brand_id" ON "layman_audit_logs" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_layman_audit_created_at" ON "layman_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_layman_prompt_history_section_id" ON "layman_prompt_history" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_layman_prompt_history_subtopic_id" ON "layman_prompt_history" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_layman_prompt_history_hash" ON "layman_prompt_history" USING btree ("prompt_hash");--> statement-breakpoint
CREATE INDEX "idx_layman_prompt_history_brand_id" ON "layman_prompt_history" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_layman_prompt_history_created_at" ON "layman_prompt_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_layman_content_revisions_section_id" ON "layman_content_revisions" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_layman_content_revisions_revision_number" ON "layman_content_revisions" USING btree ("section_id","revision_number");--> statement-breakpoint
CREATE INDEX "idx_layman_content_revisions_parent_id" ON "layman_content_revisions" USING btree ("parent_revision_id");--> statement-breakpoint
CREATE INDEX "idx_layman_content_revisions_prompt_id" ON "layman_content_revisions" USING btree ("source_prompt_id");--> statement-breakpoint
CREATE INDEX "idx_layman_content_revisions_current" ON "layman_content_revisions" USING btree ("section_id","is_current_version");--> statement-breakpoint
CREATE INDEX "idx_layman_content_revisions_created_at" ON "layman_content_revisions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_tutorial_content_subtopic" ON "tutorial_content" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_content_published" ON "tutorial_content" USING btree ("subtopic_id","is_published");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_content_subtopic_difficulty_type" ON "tutorial_content" USING btree ("subtopic_id","difficulty","content_type");--> statement-breakpoint
CREATE INDEX "idx_tutorial_content_content_gin" ON "tutorial_content" USING gin ("content");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_domains_external_id" ON "tutorial_domains" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_domains_slug" ON "tutorial_domains" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_content_versions_content_id" ON "tutorial_content_versions" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_content_audit_content_id" ON "tutorial_content_audit" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "idx_assignments_subtopic_diff" ON "tutorial_assignments" USING btree ("subtopic_id","difficulty");--> statement-breakpoint
CREATE INDEX "idx_session_requests_student" ON "live_session_requests" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "idx_session_requests_faculty" ON "live_session_requests" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "idx_session_requests_status" ON "live_session_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subjects_external_id" ON "tutorial_subjects" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subjects_slug" ON "tutorial_subjects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tutorial_subjects_domain_id" ON "tutorial_subjects" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_topics_external_id" ON "tutorial_topics" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_topics_slug" ON "tutorial_topics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tutorial_topics_subject_id" ON "tutorial_topics" USING btree ("subject_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subtopics_external_id" ON "tutorial_subtopics" USING btree ("external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_subtopics_slug" ON "tutorial_subtopics" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_tutorial_subtopics_topic_id" ON "tutorial_subtopics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_projects_scope" ON "tutorial_projects" USING btree ("scope","level");--> statement-breakpoint
CREATE INDEX "idx_tutorial_project_submissions_user" ON "tutorial_project_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_project_submissions_project" ON "tutorial_project_submissions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_project_submissions_status" ON "tutorial_project_submissions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_badges_user_badge" ON "student_badges" USING btree ("user_id","badge_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_progress_user" ON "tutorial_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_tutorial_progress_user_subtopic" ON "tutorial_progress" USING btree ("user_id","subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_tutorial_video_links_subtopic" ON "tutorial_video_links" USING btree ("subtopic_id");--> statement-breakpoint
CREATE INDEX "idx_remediation_triggers_user" ON "remediation_triggers" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_subtopic_flow_progress_user" ON "subtopic_flow_progress" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_subtopic_flow_progress_user_subtopic" ON "subtopic_flow_progress" USING btree ("user_id","subtopic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_student_streaks_user" ON "student_streaks" USING btree ("user_id");