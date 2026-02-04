ALTER TYPE "public"."exam_status" ADD VALUE 'processing' BEFORE 'completed';--> statement-breakpoint
ALTER TYPE "public"."exam_status" ADD VALUE 'failed';--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_ip" ON "login_attempts" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_subjects_domain_id" ON "subjects" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX "idx_subtopics_topic_id" ON "subtopics" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_topics_subject_id" ON "topics" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "idx_exam_questions_exam_order" ON "exam_questions" USING btree ("exam_id","order");--> statement-breakpoint
CREATE INDEX "idx_exams_user_id_status" ON "exams" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_questions_selection_filter" ON "questions" USING btree ("topic_id","subtopic_id","difficulty");--> statement-breakpoint
CREATE INDEX "idx_questions_active_partial" ON "questions" USING btree ("id") WHERE "questions"."status" = 'active';