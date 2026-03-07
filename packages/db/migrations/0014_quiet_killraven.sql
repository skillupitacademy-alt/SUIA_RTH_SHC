CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_login_attempts_user_id" ON "login_attempts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_created_at" ON "users" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_exams_blueprint_id" ON "exams" USING btree ("blueprint_id");--> statement-breakpoint
CREATE INDEX "idx_results_by_dimension_exam_id" ON "results_by_dimension" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "idx_questions_subtopic_id" ON "questions" USING btree ("subtopic_id");