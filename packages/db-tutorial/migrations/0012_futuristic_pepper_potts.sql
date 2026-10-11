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
ALTER TABLE "ai_generation_orchestration" ADD CONSTRAINT "ai_generation_orchestration_subtopic_id_tutorial_subtopics_id_fk" FOREIGN KEY ("subtopic_id") REFERENCES "public"."tutorial_subtopics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_generation_orchestration" ADD CONSTRAINT "ai_generation_orchestration_educational_architecture_id_educational_architectures_id_fk" FOREIGN KEY ("educational_architecture_id") REFERENCES "public"."educational_architectures"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_section_generation_jobs" ADD CONSTRAINT "ai_section_generation_jobs_orchestration_id_ai_generation_orchestration_id_fk" FOREIGN KEY ("orchestration_id") REFERENCES "public"."ai_generation_orchestration"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "educational_architecture_performance" ADD CONSTRAINT "educational_architecture_performance_architecture_id_educational_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."educational_architectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_template_performance" ADD CONSTRAINT "prompt_template_performance_template_id_prompt_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."prompt_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ui_architecture_performance" ADD CONSTRAINT "ui_architecture_performance_architecture_id_ui_architectures_id_fk" FOREIGN KEY ("architecture_id") REFERENCES "public"."ui_architectures"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subsection_engagement_metrics" ADD CONSTRAINT "subsection_engagement_metrics_subsection_id_tutorial_subsections_id_fk" FOREIGN KEY ("subsection_id") REFERENCES "public"."tutorial_subsections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_learning_metrics" ADD CONSTRAINT "tutorial_learning_metrics_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "idx_deployments_section" ON "content_deployments" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "idx_deployments_status" ON "content_deployments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_deployments_experiment" ON "content_deployments" USING btree ("experiment_id");--> statement-breakpoint
CREATE INDEX "idx_deployments_brand" ON "content_deployments" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "idx_review_queue_status" ON "content_review_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_review_queue_assigned" ON "content_review_queue" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "idx_review_queue_priority" ON "content_review_queue" USING btree ("priority","status");--> statement-breakpoint
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
CREATE INDEX "idx_prompt_subsection" ON "prompt_templates" USING btree ("subsection_type");
