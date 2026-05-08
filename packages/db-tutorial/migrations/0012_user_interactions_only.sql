-- User Interaction Tracking Tables
-- Only create the 5 new tables (enums already exist)

CREATE TABLE IF NOT EXISTS "code_interactions" (
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

CREATE TABLE IF NOT EXISTS "practice_test_answers" (
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

CREATE TABLE IF NOT EXISTS "quiz_answers" (
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

CREATE TABLE IF NOT EXISTS "section_completions" (
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

CREATE TABLE IF NOT EXISTS "visual_interactions" (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_code_interactions_user" ON "code_interactions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_code_interactions_section" ON "code_interactions" ("section_id");
CREATE INDEX IF NOT EXISTS "idx_code_interactions_example" ON "code_interactions" ("code_example_id");

CREATE INDEX IF NOT EXISTS "idx_practice_test_answers_user" ON "practice_test_answers" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_practice_test_answers_section" ON "practice_test_answers" ("section_id");
CREATE INDEX IF NOT EXISTS "idx_practice_test_answers_question" ON "practice_test_answers" ("question_id");

CREATE INDEX IF NOT EXISTS "idx_quiz_answers_user" ON "quiz_answers" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_answers_section" ON "quiz_answers" ("section_id");
CREATE INDEX IF NOT EXISTS "idx_quiz_answers_question" ON "quiz_answers" ("question_id");

CREATE INDEX IF NOT EXISTS "idx_section_completions_user" ON "section_completions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_section_completions_section" ON "section_completions" ("section_id");
CREATE INDEX IF NOT EXISTS "idx_section_completions_subsection" ON "section_completions" ("subsection_id");

CREATE INDEX IF NOT EXISTS "idx_visual_interactions_user" ON "visual_interactions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_visual_interactions_section" ON "visual_interactions" ("section_id");
CREATE INDEX IF NOT EXISTS "idx_visual_interactions_component" ON "visual_interactions" ("component_id");

-- Add foreign key constraints
ALTER TABLE "code_interactions" ADD CONSTRAINT "code_interactions_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "practice_test_answers" ADD CONSTRAINT "practice_test_answers_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "section_completions" ADD CONSTRAINT "section_completions_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "visual_interactions" ADD CONSTRAINT "visual_interactions_section_id_tutorial_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "tutorial_sections"("id") ON DELETE cascade ON UPDATE no action;
