ALTER TYPE "public"."section_type" ADD VALUE 'overview' BEFORE 'notes';--> statement-breakpoint
ALTER TYPE "public"."section_type" ADD VALUE 'ai_tutor';--> statement-breakpoint
CREATE TABLE "tutorial_section_ai_tutor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"greeting" text NOT NULL,
	"qa_pairs" jsonb NOT NULL,
	"tutor_prompt_card" jsonb NOT NULL,
	"misconception_detector" jsonb NOT NULL,
	"adaptive_hint_panel" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_assignment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"duration" text NOT NULL,
	"task" jsonb NOT NULL,
	"objectives" jsonb NOT NULL,
	"starter_code" text NOT NULL,
	"submission_guidelines" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_code" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"problem_context" jsonb NOT NULL,
	"basic_code_example" jsonb NOT NULL,
	"line_by_line_explanation" jsonb NOT NULL,
	"output_demonstration" jsonb NOT NULL,
	"best_practice_version" jsonb NOT NULL,
	"common_mistakes" jsonb NOT NULL,
	"real_world_implementation" jsonb NOT NULL,
	"code_summary" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_interview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"interview_intro_card" jsonb NOT NULL,
	"question_bank_panel" jsonb NOT NULL,
	"answer_framework_card" jsonb NOT NULL,
	"mock_interview_flow" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_layman" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"simple_overview" jsonb NOT NULL,
	"everyday_analogy" jsonb NOT NULL,
	"why_it_exists" jsonb NOT NULL,
	"simple_use_cases" jsonb NOT NULL,
	"beginner_breakdown" jsonb NOT NULL,
	"mental_model" jsonb NOT NULL,
	"common_confusions" jsonb NOT NULL,
	"simple_recap" jsonb NOT NULL,
	"hero_visual_svg" jsonb,
	"analogy_svg" jsonb,
	"mental_model_svg" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"simple_words" text NOT NULL,
	"definition_block" jsonb NOT NULL,
	"sections" jsonb NOT NULL,
	"component_grid" jsonb NOT NULL,
	"example_panel" jsonb NOT NULL,
	"practice_card" jsonb NOT NULL,
	"warning_faq" jsonb NOT NULL,
	"summary_card" jsonb NOT NULL,
	"syntax_block" jsonb,
	"footer_block" jsonb,
	"flashcard_visual_system" jsonb,
	"comparison_summary_chart" jsonb,
	"mnemonic_retention_graphic" jsonb,
	"cheat_sheet_svg" jsonb,
	"summary_hero_svg" jsonb,
	"concept_memory_map_svg" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_overview" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"hero" jsonb NOT NULL,
	"progress_summary" jsonb NOT NULL,
	"learning_outcomes" jsonb NOT NULL,
	"learning_roadmap" jsonb NOT NULL,
	"recommended_flow" jsonb NOT NULL,
	"readiness_context" jsonb NOT NULL,
	"navigation" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_practice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"assessment_intro" jsonb NOT NULL,
	"concept_recall_questions" jsonb NOT NULL,
	"scenario_based_questions" jsonb NOT NULL,
	"difficulty_progression" jsonb NOT NULL,
	"instant_feedback" jsonb NOT NULL,
	"common_mistake_detection" jsonb NOT NULL,
	"performance_analytics" jsonb NOT NULL,
	"revision_recommendations" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"deadline" text NOT NULL,
	"hero" jsonb NOT NULL,
	"real_world_use" text NOT NULL,
	"skills" jsonb NOT NULL,
	"build_items" jsonb NOT NULL,
	"deliverables" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_quiz" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"total_questions" integer NOT NULL,
	"duration" text NOT NULL,
	"xp" integer DEFAULT 0 NOT NULL,
	"questions" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_real_life" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"concept_mapping" jsonb NOT NULL,
	"industry_use_case" jsonb NOT NULL,
	"daily_life_example" jsonb NOT NULL,
	"career_relevance" jsonb NOT NULL,
	"problem_solution_context" jsonb NOT NULL,
	"business_application" jsonb NOT NULL,
	"domain_scenarios" jsonb NOT NULL,
	"practical_recap" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"mastery_recap_card" jsonb NOT NULL,
	"key_takeaway_grid" jsonb NOT NULL,
	"revision_checklist" jsonb NOT NULL,
	"next_step_panel" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_technical" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"badge" text NOT NULL,
	"intro" text NOT NULL,
	"sections" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_section_visual" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"concept_visual_intro" jsonb NOT NULL,
	"diagrammatic_breakdown" jsonb NOT NULL,
	"step_by_step_visual_flow" jsonb NOT NULL,
	"comparative_visualization" jsonb NOT NULL,
	"mental_model_visualization" jsonb NOT NULL,
	"real_world_visual_mapping" jsonb NOT NULL,
	"common_confusion_visualization" jsonb NOT NULL,
	"visual_summary" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tutorial_section_ai_tutor" ADD CONSTRAINT "tutorial_section_ai_tutor_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_assignment" ADD CONSTRAINT "tutorial_section_assignment_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_code" ADD CONSTRAINT "tutorial_section_code_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_interview" ADD CONSTRAINT "tutorial_section_interview_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_layman" ADD CONSTRAINT "tutorial_section_layman_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_notes" ADD CONSTRAINT "tutorial_section_notes_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_overview" ADD CONSTRAINT "tutorial_section_overview_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_practice" ADD CONSTRAINT "tutorial_section_practice_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_project" ADD CONSTRAINT "tutorial_section_project_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_quiz" ADD CONSTRAINT "tutorial_section_quiz_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_real_life" ADD CONSTRAINT "tutorial_section_real_life_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_summary" ADD CONSTRAINT "tutorial_section_summary_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_technical" ADD CONSTRAINT "tutorial_section_technical_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_section_visual" ADD CONSTRAINT "tutorial_section_visual_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_sections_delivery" ON "tutorial_sections" USING btree ("subtopic_id","difficulty","status","order_index");--> statement-breakpoint
CREATE INDEX "idx_sections_delivery_by_type" ON "tutorial_sections" USING btree ("subtopic_id","difficulty","section_type","status");