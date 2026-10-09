CREATE TABLE "project_ai_approvals" (
	"approval_id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"candidate_sha256" text NOT NULL,
	"placement_manifest_id" text NOT NULL,
	"placement_manifest_sha256" text NOT NULL,
	"target_family" text NOT NULL,
	"target_version" text NOT NULL,
	"approved_by" text NOT NULL,
	"approval_timestamp" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"workflow_requester" text,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "project_ai_candidates" (
	"candidate_id" text PRIMARY KEY NOT NULL,
	"workflow_id" text,
	"files" jsonb NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	"uploaded_by" text NOT NULL,
	"target_family" text,
	"target_version" text,
	"candidate_sha256" text
);
--> statement-breakpoint
CREATE TABLE "project_ai_contracts" (
	"contract_id" text PRIMARY KEY NOT NULL,
	"workflow_id" text NOT NULL,
	"contract_hash" text NOT NULL,
	"contract_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"contract_version" text DEFAULT '1.0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_ai_manifests" (
	"manifest_id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"manifest_hash" text NOT NULL,
	"decision" text NOT NULL,
	"target_path" text NOT NULL,
	"block_family" text NOT NULL,
	"block_version" text NOT NULL,
	"required_changes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_ai_state_transitions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "project_ai_state_transitions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"workflow_id" text NOT NULL,
	"from_state" text,
	"to_state" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"triggered_by" text NOT NULL,
	"evidence_id" text,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "project_ai_workflows" (
	"workflow_id" text PRIMARY KEY NOT NULL,
	"specification_id" text NOT NULL,
	"target_family" text NOT NULL,
	"target_version" text NOT NULL,
	"requester_id" text NOT NULL,
	"current_state" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"contract_id" text,
	"contract_sha256" text,
	"candidate_id" text,
	"candidate_sha256" text,
	"manifest_id" text,
	"manifest_sha256" text,
	"snapshot_id" text,
	"snapshot_sha256" text,
	"approval_id" text,
	"gate_results" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evidence_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"final_status" text,
	"version" integer DEFAULT 1 NOT NULL,
	"idempotency_key" text
);
--> statement-breakpoint
ALTER TABLE "project_ai_approvals" ADD CONSTRAINT "project_ai_approvals_workflow_id_project_ai_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."project_ai_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ai_candidates" ADD CONSTRAINT "project_ai_candidates_workflow_id_project_ai_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."project_ai_workflows"("workflow_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ai_contracts" ADD CONSTRAINT "project_ai_contracts_workflow_id_project_ai_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."project_ai_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ai_manifests" ADD CONSTRAINT "project_ai_manifests_candidate_id_project_ai_candidates_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."project_ai_candidates"("candidate_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_ai_state_transitions" ADD CONSTRAINT "project_ai_state_transitions_workflow_id_project_ai_workflows_workflow_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."project_ai_workflows"("workflow_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approval_workflow" ON "project_ai_approvals" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_approval_status" ON "project_ai_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_approval_candidate_sha" ON "project_ai_approvals" USING btree ("candidate_sha256");--> statement-breakpoint
CREATE INDEX "idx_approval_manifest_sha" ON "project_ai_approvals" USING btree ("placement_manifest_sha256");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_approval_workflow" ON "project_ai_approvals" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_candidate_workflow" ON "project_ai_candidates" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_candidate_uploaded_at" ON "project_ai_candidates" USING btree ("uploaded_at");--> statement-breakpoint
CREATE INDEX "idx_candidate_sha256" ON "project_ai_candidates" USING btree ("candidate_sha256");--> statement-breakpoint
CREATE INDEX "idx_contract_workflow" ON "project_ai_contracts" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_contract_hash" ON "project_ai_contracts" USING btree ("contract_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_contract_workflow" ON "project_ai_contracts" USING btree ("workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_contract_hash" ON "project_ai_contracts" USING btree ("contract_hash");--> statement-breakpoint
CREATE INDEX "idx_manifest_candidate" ON "project_ai_manifests" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_manifest_hash" ON "project_ai_manifests" USING btree ("manifest_hash");--> statement-breakpoint
CREATE INDEX "idx_manifest_decision" ON "project_ai_manifests" USING btree ("decision");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_manifest_hash" ON "project_ai_manifests" USING btree ("manifest_hash");--> statement-breakpoint
CREATE INDEX "idx_transition_workflow" ON "project_ai_state_transitions" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "idx_transition_timestamp" ON "project_ai_state_transitions" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_workflow_state" ON "project_ai_workflows" USING btree ("current_state");--> statement-breakpoint
CREATE INDEX "idx_workflow_requester" ON "project_ai_workflows" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "idx_workflow_target" ON "project_ai_workflows" USING btree ("target_family","target_version");--> statement-breakpoint
CREATE INDEX "idx_workflow_contract_sha" ON "project_ai_workflows" USING btree ("contract_sha256");--> statement-breakpoint
CREATE INDEX "idx_workflow_candidate_sha" ON "project_ai_workflows" USING btree ("candidate_sha256");--> statement-breakpoint
CREATE INDEX "idx_workflow_manifest_sha" ON "project_ai_workflows" USING btree ("manifest_sha256");--> statement-breakpoint
CREATE INDEX "idx_workflow_created_at" ON "project_ai_workflows" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_workflow_idempotency" ON "project_ai_workflows" USING btree ("idempotency_key");