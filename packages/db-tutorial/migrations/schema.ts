import { pgTable, uniqueIndex, uuid, timestamp, integer, text, jsonb, index, foreignKey, boolean, unique, varchar, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const assignmentHelpRequestStatus = pgEnum("assignment_help_request_status", ['open', 'in_progress', 'resolved'])
export const assignmentProgressStatus = pgEnum("assignment_progress_status", ['not_started', 'in_progress', 'self_completed'])
export const assignmentQuestionType = pgEnum("assignment_question_type", ['mcq', 'short_answer', 'code', 'open_ended'])
export const brand = pgEnum("brand", ['realtutorialhub', 'skillup', 'skillhubcore', 'shared'])
export const brandVisibility = pgEnum("brand_visibility", ['brand_exclusive', 'shared_visible', 'white_label'])
export const deploymentType = pgEnum("deployment_type", ['full', 'staged', 'canary', 'ab_test', 'dark_launch'])
export const domainCategory = pgEnum("domain_category", ['academic', 'professional', 'technical', 'creative', 'life_skills'])
export const entityStatus = pgEnum("entity_status", ['draft', 'active', 'archived', 'deleted'])
export const jobStatus = pgEnum("job_status", ['pending', 'running', 'validating', 'completed', 'failed', 'retrying'])
export const laymanAuditAction = pgEnum("layman_audit_action", ['prompt_generated', 'prompt_exported', 'prompt_copied', 'prompt_modified', 'content_ingested', 'content_parsed', 'content_validated', 'content_revised', 'content_sanitized', 'section_created', 'section_updated', 'section_submitted_review', 'section_approved', 'section_rejected', 'section_published', 'section_archived', 'section_restored', 'validation_passed', 'validation_failed', 'quality_score_calculated', 'hallucination_detected', 'tamper_detected', 'sanitization_applied', 'rollback_executed'])
export const liveSessionRequestStatus = pgEnum("live_session_request_status", ['pending', 'accepted', 'scheduled', 'completed', 'cancelled'])
export const orchestrationStatus = pgEnum("orchestration_status", ['pending', 'in_progress', 'completed', 'failed', 'cancelled'])
export const priorityLevel = pgEnum("priority_level", ['low', 'normal', 'high', 'urgent'])
export const reviewStatus = pgEnum("review_status", ['pending_review', 'in_review', 'approved', 'rejected', 'changes_requested'])
export const sectionStatus = pgEnum("section_status", ['draft', 'generating', 'validating', 'pending_review', 'in_review', 'changes_requested', 'approved', 'deploying', 'deployed', 'archived'])
export const sectionType = pgEnum("section_type", ['overview', 'notes', 'layman', 'visual', 'real_life', 'technical', 'code', 'practice', 'assignment', 'project', 'quiz', 'summary', 'interview', 'ai_tutor'])
export const skillCategory = pgEnum("skill_category", ['technical', 'soft', 'analytical', 'creative', 'managerial', 'communication'])
export const subsectionType = pgEnum("subsection_type", ['definition', 'concept', 'syntax', 'analogy', 'example', 'visual', 'diagram', 'animation', 'pitfall', 'antipattern', 'gotcha', 'code', 'exercise', 'challenge', 'sandbox', 'checklist', 'cheatsheet', 'faq', 'glossary', 'interview_question', 'quiz_question', 'project_step', 'project_milestone', 'project_deliverable'])
export const topicComplexity = pgEnum("topic_complexity", ['beginner', 'intermediate', 'advanced', 'expert'])
export const tutorialContentAuditAction = pgEnum("tutorial_content_audit_action", ['created', 'updated', 'published', 'unpublished', 'restored'])
export const tutorialContentJobStatus = pgEnum("tutorial_content_job_status", ['pending', 'processing', 'completed', 'failed'])
export const tutorialDeliverableType = pgEnum("tutorial_deliverable_type", ['code', 'repo', 'live_demo', 'document'])
export const tutorialDifficulty = pgEnum("tutorial_difficulty", ['simple', 'mixed', 'intermediate', 'expert'])
export const tutorialEvaluationType = pgEnum("tutorial_evaluation_type", ['auto', 'ai_review', 'peer_review', 'admin_review'])
export const tutorialProgressStatus = pgEnum("tutorial_progress_status", ['not_started', 'in_progress', 'completed'])
export const tutorialProjectLevel = pgEnum("tutorial_project_level", ['simple', 'intermediate', 'expert'])
export const tutorialProjectScope = pgEnum("tutorial_project_scope", ['topic', 'subject', 'domain'])
export const tutorialProjectSubmissionStatus = pgEnum("tutorial_project_submission_status", ['pending', 'submitted', 'ai_reviewing', 'needs_review', 'approved', 'revision_needed', 'graded', 'revision-requested'])
export const tutorialQuestionType = pgEnum("tutorial_question_type", ['mcq', 'short_answer', 'code', 'drag_drop', 'fill_blank'])
export const tutorialTriggerStatus = pgEnum("tutorial_trigger_status", ['pending', 'accepted', 'dismissed', 'completed', 'failed'])
export const tutorialVideoProvider = pgEnum("tutorial_video_provider", ['youtube', 'vimeo', 'custom', 'loom'])


export const aiGenerationMetrics = pgTable("ai_generation_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	hour: integer(),
	aggregationLevel: text("aggregation_level").notNull(),
	totalGenerations: integer("total_generations").default(0).notNull(),
	successfulGenerations: integer("successful_generations").default(0).notNull(),
	failedGenerations: integer("failed_generations").default(0).notNull(),
	validationPassRate: integer("validation_pass_rate").default(0).notNull(),
	averageQualityScore: integer("average_quality_score").default(0).notNull(),
	averageHallucinationScore: integer("average_hallucination_score").default(0).notNull(),
	hallucinationIncidents: integer("hallucination_incidents").default(0).notNull(),
	approvalRate: integer("approval_rate").default(0).notNull(),
	averageReviewTimeMinutes: integer("average_review_time_minutes").default(0).notNull(),
	averageGenerationTimeMs: integer("average_generation_time_ms").default(0).notNull(),
	totalTokensUsed: integer("total_tokens_used").default(0).notNull(),
	totalCostUsd: integer("total_cost_usd").default(0).notNull(),
	providerBreakdown: jsonb("provider_breakdown"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_metrics_date_hour_level").using("btree", table.date.asc().nullsLast().op("text_ops"), table.hour.asc().nullsLast().op("text_ops"), table.aggregationLevel.asc().nullsLast().op("int4_ops")),
]);

export const educationalArchitecturePerformance = pgTable("educational_architecture_performance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	aggregationLevel: text("aggregation_level").notNull(),
	architectureId: uuid("architecture_id").notNull(),
	brandId: brand("brand_id").notNull(),
	totalUsages: integer("total_usages").default(0).notNull(),
	uniqueUsers: integer("unique_users").default(0).notNull(),
	averageCompletionRate: integer("average_completion_rate").default(0).notNull(),
	averageTimeToComplete: integer("average_time_to_complete").default(0).notNull(),
	averageQuizScore: integer("average_quiz_score"),
	averageAssignmentScore: integer("average_assignment_score"),
	averageEngagementScore: integer("average_engagement_score").default(0).notNull(),
	retentionRate: integer("retention_rate").default(0).notNull(),
	satisfactionScore: integer("satisfaction_score"),
	recommendationRate: integer("recommendation_rate"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_educational_perf_arch").using("btree", table.architectureId.asc().nullsLast().op("uuid_ops")),
	index("idx_educational_perf_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	uniqueIndex("uq_educational_perf_date_arch_brand").using("btree", table.date.asc().nullsLast().op("enum_ops"), table.architectureId.asc().nullsLast().op("uuid_ops"), table.brandId.asc().nullsLast().op("text_ops"), table.aggregationLevel.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.architectureId],
			foreignColumns: [educationalArchitectures.id],
			name: "educational_architecture_performance_architecture_id_educationa"
		}).onDelete("cascade"),
]);

export const promptTemplatePerformance = pgTable("prompt_template_performance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	aggregationLevel: text("aggregation_level").notNull(),
	templateId: uuid("template_id").notNull(),
	brandId: brand("brand_id").notNull(),
	totalGenerations: integer("total_generations").default(0).notNull(),
	successfulGenerations: integer("successful_generations").default(0).notNull(),
	failedGenerations: integer("failed_generations").default(0).notNull(),
	averageQualityScore: integer("average_quality_score").default(0).notNull(),
	averageHallucinationScore: integer("average_hallucination_score").default(0).notNull(),
	validationPassRate: integer("validation_pass_rate").default(0).notNull(),
	approvalRate: integer("approval_rate").default(0).notNull(),
	averageReviewTime: integer("average_review_time").default(0).notNull(),
	regenerationRate: integer("regeneration_rate").default(0).notNull(),
	totalTokensUsed: integer("total_tokens_used").default(0).notNull(),
	totalCostUsd: integer("total_cost_usd").default(0).notNull(),
	averageCostPerGeneration: integer("average_cost_per_generation").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_prompt_perf_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	index("idx_prompt_perf_template").using("btree", table.templateId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_prompt_perf_date_template_brand").using("btree", table.date.asc().nullsLast().op("enum_ops"), table.templateId.asc().nullsLast().op("uuid_ops"), table.brandId.asc().nullsLast().op("text_ops"), table.aggregationLevel.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [promptTemplates.id],
			name: "prompt_template_performance_template_id_prompt_templates_id_fk"
		}).onDelete("cascade"),
]);

export const uiArchitecturePerformance = pgTable("ui_architecture_performance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	aggregationLevel: text("aggregation_level").notNull(),
	architectureId: uuid("architecture_id").notNull(),
	brandId: brand("brand_id").notNull(),
	totalRenders: integer("total_renders").default(0).notNull(),
	uniqueUsers: integer("unique_users").default(0).notNull(),
	averageLoadTime: integer("average_load_time").default(0).notNull(),
	averageRenderTime: integer("average_render_time").default(0).notNull(),
	errorRate: integer("error_rate").default(0).notNull(),
	bounceRate: integer("bounce_rate").default(0).notNull(),
	averageSessionDuration: integer("average_session_duration").default(0).notNull(),
	interactionRate: integer("interaction_rate").default(0).notNull(),
	accessibilityScore: integer("accessibility_score"),
	screenReaderUsage: integer("screen_reader_usage").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ui_perf_arch").using("btree", table.architectureId.asc().nullsLast().op("uuid_ops")),
	index("idx_ui_perf_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	uniqueIndex("uq_ui_perf_date_arch_brand").using("btree", table.date.asc().nullsLast().op("enum_ops"), table.architectureId.asc().nullsLast().op("uuid_ops"), table.brandId.asc().nullsLast().op("text_ops"), table.aggregationLevel.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.architectureId],
			foreignColumns: [uiArchitectures.id],
			name: "ui_architecture_performance_architecture_id_ui_architectures_id"
		}).onDelete("cascade"),
]);

export const brandPerformanceMetrics = pgTable("brand_performance_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	aggregationLevel: text("aggregation_level").notNull(),
	brandId: brand("brand_id").notNull(),
	totalUsers: integer("total_users").default(0).notNull(),
	activeUsers: integer("active_users").default(0).notNull(),
	newUsers: integer("new_users").default(0).notNull(),
	churnedUsers: integer("churned_users").default(0).notNull(),
	averageSessionsPerUser: integer("average_sessions_per_user").default(0).notNull(),
	averageSessionDuration: integer("average_session_duration").default(0).notNull(),
	totalContentViews: integer("total_content_views").default(0).notNull(),
	tutorialsStarted: integer("tutorials_started").default(0).notNull(),
	tutorialsCompleted: integer("tutorials_completed").default(0).notNull(),
	averageCompletionRate: integer("average_completion_rate").default(0).notNull(),
	certificatesIssued: integer("certificates_issued").default(0).notNull(),
	dayOneRetention: integer("day_one_retention").default(0).notNull(),
	daySevenRetention: integer("day_seven_retention").default(0).notNull(),
	dayThirtyRetention: integer("day_thirty_retention").default(0).notNull(),
	freeToProConversions: integer("free_to_pro_conversions").default(0).notNull(),
	conversionRate: integer("conversion_rate").default(0).notNull(),
	totalRevenue: integer("total_revenue").default(0).notNull(),
	subscriptionRevenue: integer("subscription_revenue").default(0).notNull(),
	averageRevenuePerUser: integer("average_revenue_per_user").default(0).notNull(),
	npsScore: integer("nps_score"),
	averageSatisfactionScore: integer("average_satisfaction_score"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_brand_perf_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	index("idx_brand_perf_date").using("btree", table.date.asc().nullsLast().op("timestamp_ops")),
	uniqueIndex("uq_brand_perf_date_brand").using("btree", table.date.asc().nullsLast().op("text_ops"), table.brandId.asc().nullsLast().op("enum_ops"), table.aggregationLevel.asc().nullsLast().op("enum_ops")),
]);

export const deploymentCohortMetrics = pgTable("deployment_cohort_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	aggregationLevel: text("aggregation_level").notNull(),
	deploymentId: uuid("deployment_id").notNull(),
	cohortName: text("cohort_name").notNull(),
	brandId: brand("brand_id").notNull(),
	totalUsers: integer("total_users").default(0).notNull(),
	activeUsers: integer("active_users").default(0).notNull(),
	averageCompletionRate: integer("average_completion_rate").default(0).notNull(),
	averageEngagementScore: integer("average_engagement_score").default(0).notNull(),
	averageTimeSpent: integer("average_time_spent").default(0).notNull(),
	controlGroupCompletionRate: integer("control_group_completion_rate"),
	liftVsControl: integer("lift_vs_control"),
	conversionRate: integer("conversion_rate").default(0).notNull(),
	revenueImpact: integer("revenue_impact").default(0).notNull(),
	sampleSize: integer("sample_size").default(0).notNull(),
	confidenceLevel: integer("confidence_level"),
	isStatisticallySignificant: text("is_statistically_significant"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_deployment_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	index("idx_deployment_cohort").using("btree", table.deploymentId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_deployment_cohort_date_brand").using("btree", table.date.asc().nullsLast().op("enum_ops"), table.deploymentId.asc().nullsLast().op("uuid_ops"), table.cohortName.asc().nullsLast().op("timestamp_ops"), table.brandId.asc().nullsLast().op("text_ops"), table.aggregationLevel.asc().nullsLast().op("text_ops")),
]);

export const aiGenerationOrchestration = pgTable("ai_generation_orchestration", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	difficulty: tutorialDifficulty().notNull(),
	educationalArchitectureId: uuid("educational_architecture_id").notNull(),
	status: orchestrationStatus().default('pending').notNull(),
	sectionsToGenerate: jsonb("sections_to_generate").notNull(),
	sectionsGenerated: jsonb("sections_generated").default([]).notNull(),
	sectionsFailed: jsonb("sections_failed").default([]).notNull(),
	totalSections: integer("total_sections").notNull(),
	completedSections: integer("completed_sections").default(0).notNull(),
	failedSections: integer("failed_sections").default(0).notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	estimatedCompletionAt: timestamp("estimated_completion_at", { mode: 'string' }),
	totalTokensUsed: integer("total_tokens_used").default(0).notNull(),
	totalCostUsd: integer("total_cost_usd").default(0).notNull(),
	error: text(),
	retryCount: integer("retry_count").default(0).notNull(),
	maxRetries: integer("max_retries").default(3).notNull(),
	brandId: brand("brand_id").default('shared').notNull(),
	initiatedBy: uuid("initiated_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_orchestration_architecture").using("btree", table.educationalArchitectureId.asc().nullsLast().op("uuid_ops")),
	index("idx_orchestration_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	index("idx_orchestration_initiator").using("btree", table.initiatedBy.asc().nullsLast().op("uuid_ops")),
	index("idx_orchestration_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_orchestration_subtopic").using("btree", table.subtopicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [tutorialSubtopics.id],
			name: "ai_generation_orchestration_subtopic_id_tutorial_subtopics_id_f"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.educationalArchitectureId],
			foreignColumns: [educationalArchitectures.id],
			name: "ai_generation_orchestration_educational_architecture_id_educati"
		}).onDelete("restrict"),
]);

export const revenueAttributionMetrics = pgTable("revenue_attribution_metrics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	date: timestamp({ mode: 'string' }).notNull(),
	aggregationLevel: text("aggregation_level").notNull(),
	brandId: brand("brand_id").notNull(),
	attributionSource: text("attribution_source").notNull(),
	attributionId: uuid("attribution_id"),
	directRevenue: integer("direct_revenue").default(0).notNull(),
	assistedRevenue: integer("assisted_revenue").default(0).notNull(),
	totalAttributedRevenue: integer("total_attributed_revenue").default(0).notNull(),
	conversions: integer().default(0).notNull(),
	conversionRate: integer("conversion_rate").default(0).notNull(),
	averageTouchpoints: integer("average_touchpoints").default(0).notNull(),
	averageTimeToConversion: integer("average_time_to_conversion").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_revenue_attr_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	index("idx_revenue_attr_source").using("btree", table.attributionSource.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_revenue_attr_date_source_brand").using("btree", table.date.asc().nullsLast().op("enum_ops"), table.attributionSource.asc().nullsLast().op("uuid_ops"), table.attributionId.asc().nullsLast().op("timestamp_ops"), table.brandId.asc().nullsLast().op("enum_ops"), table.aggregationLevel.asc().nullsLast().op("text_ops")),
]);

export const tutorialSections = pgTable("tutorial_sections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	orderIndex: integer("order_index").default(0).notNull(),
	content: jsonb().notNull(),
	version: integer().default(1).notNull(),
	language: text().default('en').notNull(),
	status: sectionStatus().default('draft').notNull(),
	generatedByAi: boolean("generated_by_ai").default(false).notNull(),
	aiModelUsed: text("ai_model_used"),
	generationJobId: uuid("generation_job_id"),
	qualityScore: integer("quality_score"),
	hallucinationScore: integer("hallucination_score"),
	regenerationCount: integer("regeneration_count").default(0).notNull(),
	approvedBy: uuid("approved_by"),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectionReason: text("rejection_reason"),
	promptTemplateId: uuid("prompt_template_id"),
	educationalArchitectureId: uuid("educational_architecture_id"),
	uiArchitectureId: uuid("ui_architecture_id"),
	brandId: brand("brand_id").default('shared').notNull(),
	brandVisibility: brandVisibility("brand_visibility").default('shared_visible').notNull(),
	brandCustomizations: jsonb("brand_customizations"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	navigationNodeId: text("navigation_node_id").notNull(),
}, (table) => [
	index("idx_tutorial_v2_by_architecture").using("btree", table.educationalArchitectureId.asc().nullsLast().op("uuid_ops")).where(sql`(educational_architecture_id IS NOT NULL)`),
	index("idx_tutorial_v2_by_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("timestamp_ops"), table.updatedAt.desc().nullsFirst().op("enum_ops")),
	index("idx_tutorial_v2_by_status").using("btree", table.status.asc().nullsLast().op("timestamp_ops"), table.updatedAt.desc().nullsFirst().op("enum_ops")).where(sql`(status = ANY (ARRAY['draft'::section_status, 'pending_review'::section_status, 'in_review'::section_status, 'changes_requested'::section_status]))`),
	index("idx_tutorial_v2_delivery").using("btree", table.subtopicId.asc().nullsLast().op("text_ops"), table.navigationNodeId.asc().nullsLast().op("uuid_ops"), table.brandId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	index("idx_tutorial_v2_subtopic_status").using("btree", table.subtopicId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	uniqueIndex("uq_tutorial_v2_identity_active").using("btree", table.subtopicId.asc().nullsLast().op("enum_ops"), table.navigationNodeId.asc().nullsLast().op("enum_ops"), table.brandId.asc().nullsLast().op("enum_ops")).where(sql`(deleted_at IS NULL)`),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [tutorialSubtopics.id],
			name: "tutorial_sections_subtopic_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.promptTemplateId],
			foreignColumns: [promptTemplates.id],
			name: "tutorial_sections_prompt_template_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.educationalArchitectureId],
			foreignColumns: [educationalArchitectures.id],
			name: "tutorial_sections_educational_architecture_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.uiArchitectureId],
			foreignColumns: [uiArchitectures.id],
			name: "tutorial_sections_ui_architecture_id_fkey"
		}).onDelete("set null"),
]);

export const assignmentHelpRequests = pgTable("assignment_help_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	assignmentId: uuid("assignment_id").notNull(),
	question: text().notNull(),
	status: assignmentHelpRequestStatus().default('open').notNull(),
	assignedTo: uuid("assigned_to"),
	resolvedAt: timestamp("resolved_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("uq_assignment_help_request_user_assignment").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.assignmentId.asc().nullsLast().op("uuid_ops"), table.subtopicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.assignmentId],
			foreignColumns: [tutorialAssignments.id],
			name: "assignment_help_requests_assignment_id_tutorial_assignments_id_"
		}),
]);

export const assignmentProgress = pgTable("assignment_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	difficulty: tutorialDifficulty().notNull(),
	status: assignmentProgressStatus().default('not_started').notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("uq_assignment_progress_user_subtopic_difficulty").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.subtopicId.asc().nullsLast().op("enum_ops"), table.difficulty.asc().nullsLast().op("enum_ops")),
]);

export const certificates = pgTable("certificates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	scope: tutorialProjectScope().notNull(),
	parentId: uuid("parent_id").notNull(),
	parentName: text("parent_name").notNull(),
	verificationCode: text("verification_code").notNull(),
	pdfUrl: text("pdf_url"),
	issuedAt: timestamp("issued_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_certificates_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("idx_certificates_verify").using("btree", table.verificationCode.asc().nullsLast().op("text_ops")),
]);

export const badges = pgTable("badges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	iconUrl: text("icon_url"),
	level: tutorialProjectLevel(),
	scope: tutorialProjectScope(),
	criteria: jsonb(),
	version: integer().default(1).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_badges_scope").using("btree", table.scope.asc().nullsLast().op("enum_ops"), table.level.asc().nullsLast().op("enum_ops")),
]);

export const contentGenerationJobs = pgTable("content_generation_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	difficulty: tutorialDifficulty().notNull(),
	status: tutorialContentJobStatus().default('pending').notNull(),
	promptVersion: integer("prompt_version").default(1).notNull(),
	prompt: jsonb(),
	result: jsonb(),
	error: text(),
	generatedBy: uuid("generated_by"),
	processedAt: timestamp("processed_at", { mode: 'string' }),
	retryCount: integer("retry_count").default(0).notNull(),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_content_generation_jobs_subtopic").using("btree", table.subtopicId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
]);

export const contentReviewQueue = pgTable("content_review_queue", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	orchestrationId: uuid("orchestration_id").notNull(),
	sectionId: uuid("section_id").notNull(),
	assignedTo: uuid("assigned_to"),
	assignedAt: timestamp("assigned_at", { mode: 'string' }),
	status: reviewStatus().default('pending_review').notNull(),
	reviewComments: text("review_comments"),
	rejectionReason: text("rejection_reason"),
	suggestedChanges: jsonb("suggested_changes"),
	reviewerQualityScore: integer("reviewer_quality_score"),
	reviewerFlags: jsonb("reviewer_flags"),
	reviewStartedAt: timestamp("review_started_at", { mode: 'string' }),
	reviewCompletedAt: timestamp("review_completed_at", { mode: 'string' }),
	priority: priorityLevel().default('normal').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_review_queue_assigned").using("btree", table.assignedTo.asc().nullsLast().op("uuid_ops")),
	index("idx_review_queue_priority").using("btree", table.priority.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("enum_ops")),
	index("idx_review_queue_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const domainContentConfig = pgTable("domain_content_config", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	domainId: uuid("domain_id").notNull(),
	audienceProfile: text("audience_profile").notNull(),
	defaultLanguage: text("default_language").default('en').notNull(),
	seoTitleTemplate: text("seo_title_template"),
	aiTutorEnabled: boolean("ai_tutor_enabled").default(true).notNull(),
	contentReviewRequired: boolean("content_review_required").default(true).notNull(),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_domain_content_config_domain").using("btree", table.domainId.asc().nullsLast().op("text_ops"), table.defaultLanguage.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_domain_content_config_domain").using("btree", table.domainId.asc().nullsLast().op("uuid_ops")),
]);

export const educationalArchitectures = pgTable("educational_architectures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	targetAudience: jsonb("target_audience").notNull(),
	targetDomains: jsonb("target_domains"),
	sectionSequence: jsonb("section_sequence").notNull(),
	interactivityLevel: text("interactivity_level").default('medium').notNull(),
	visualDensity: text("visual_density").default('medium').notNull(),
	brandId: brand("brand_id").default('shared').notNull(),
	brandVisibility: brandVisibility("brand_visibility").default('shared_visible').notNull(),
	brandOverrides: jsonb("brand_overrides"),
	isActive: boolean("is_active").default(true).notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_educational_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_educational_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	unique("educational_architectures_name_unique").on(table.name),
]);

export const tutorialNavigationProgress = pgTable("tutorial_navigation_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	navigationNodeId: text("navigation_node_id").notNull(),
	sectionId: uuid("section_id"),
	subtopicId: uuid("subtopic_id").notNull(),
	status: tutorialProgressStatus().default('not_started').notNull(),
	completedBlocks: jsonb("completed_blocks").default([]).notNull(),
	timeSpentActiveSec: integer("time_spent_active_sec").default(0).notNull(),
	visitCount: integer("visit_count").default(0).notNull(),
	revisionCount: integer("revision_count").default(0).notNull(),
	lastSessionId: text("last_session_id"),
	firstViewedAt: timestamp("first_viewed_at", { mode: 'string' }),
	lastViewedAt: timestamp("last_viewed_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_navigation_progress_last_viewed").using("btree", table.userId.asc().nullsLast().op("timestamp_ops"), table.lastViewedAt.asc().nullsLast().op("uuid_ops")),
	index("idx_navigation_progress_node").using("btree", table.navigationNodeId.asc().nullsLast().op("text_ops")),
	index("idx_navigation_progress_subtopic").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.subtopicId.asc().nullsLast().op("uuid_ops")),
	index("idx_navigation_progress_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_navigation_progress_user_node").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.navigationNodeId.asc().nullsLast().op("uuid_ops")).where(sql`(deleted_at IS NULL)`),
]);

export const uiArchitectures = pgTable("ui_architectures", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	sectionRenderers: jsonb("section_renderers").notNull(),
	responsiveBreakpoints: jsonb("responsive_breakpoints"),
	accessibilityProfile: text("accessibility_profile").default('standard').notNull(),
	brandId: brand("brand_id").default('shared').notNull(),
	brandVisibility: brandVisibility("brand_visibility").default('shared_visible').notNull(),
	brandCompatibility: jsonb("brand_compatibility"),
	isActive: boolean("is_active").default(true).notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_ui_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_ui_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	unique("ui_architectures_name_unique").on(table.name),
]);

export const laymanAuditLogs = pgTable("layman_audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionId: uuid("section_id"),
	promptId: uuid("prompt_id"),
	action: laymanAuditAction().notNull(),
	actionCategory: varchar("action_category", { length: 50 }).notNull(),
	userId: uuid("user_id").notNull(),
	userRole: varchar("user_role", { length: 50 }),
	brandId: varchar("brand_id", { length: 50 }).notNull(),
	beforeState: jsonb("before_state"),
	afterState: jsonb("after_state"),
	diff: jsonb(),
	metadata: jsonb(),
	ipAddress: varchar("ip_address", { length: 45 }),
	userAgent: text("user_agent"),
	success: varchar({ length: 20 }).default('success').notNull(),
	errorMessage: text("error_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_layman_audit_action").using("btree", table.action.asc().nullsLast().op("enum_ops")),
	index("idx_layman_audit_brand_id").using("btree", table.brandId.asc().nullsLast().op("text_ops")),
	index("idx_layman_audit_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_layman_audit_prompt_id").using("btree", table.promptId.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_audit_section_id").using("btree", table.sectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_audit_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const laymanPromptHistory = pgTable("layman_prompt_history", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionId: uuid("section_id"),
	subtopicId: uuid("subtopic_id").notNull(),
	promptTemplateId: uuid("prompt_template_id").notNull(),
	templateName: varchar("template_name", { length: 255 }).notNull(),
	templateVersion: varchar("template_version", { length: 50 }).notNull(),
	systemPrompt: text("system_prompt").notNull(),
	userPrompt: text("user_prompt").notNull(),
	fullPrompt: text("full_prompt").notNull(),
	variables: jsonb().notNull(),
	promptHash: varchar("prompt_hash", { length: 64 }).notNull(),
	promptSignature: text("prompt_signature"),
	brandId: varchar("brand_id", { length: 50 }).notNull(),
	educationalArchitectureId: uuid("educational_architecture_id"),
	educationalArchitectureName: varchar("educational_architecture_name", { length: 255 }),
	uiArchitectureId: uuid("ui_architecture_id"),
	uiArchitectureName: varchar("ui_architecture_name", { length: 255 }),
	wasUsed: varchar("was_used", { length: 20 }).default('pending').notNull(),
	usedAt: timestamp("used_at", { mode: 'string' }),
	exportCount: integer("export_count").default(0).notNull(),
	lastExportedAt: timestamp("last_exported_at", { mode: 'string' }),
	exportFormat: varchar("export_format", { length: 50 }),
	metadata: jsonb(),
	generatedBy: uuid("generated_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_layman_prompt_history_brand_id").using("btree", table.brandId.asc().nullsLast().op("text_ops")),
	index("idx_layman_prompt_history_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_layman_prompt_history_hash").using("btree", table.promptHash.asc().nullsLast().op("text_ops")),
	index("idx_layman_prompt_history_section_id").using("btree", table.sectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_prompt_history_subtopic_id").using("btree", table.subtopicId.asc().nullsLast().op("uuid_ops")),
]);

export const laymanContentRevisions = pgTable("layman_content_revisions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionId: uuid("section_id").notNull(),
	revisionNumber: integer("revision_number").notNull(),
	parentRevisionId: uuid("parent_revision_id"),
	content: jsonb().notNull(),
	qualityScore: integer("quality_score"),
	hallucinationRisk: integer("hallucination_risk"),
	completenessScore: integer("completeness_score"),
	validationErrors: jsonb("validation_errors"),
	validationWarnings: jsonb("validation_warnings"),
	status: varchar({ length: 50 }).notNull(),
	governanceStatus: varchar("governance_status", { length: 50 }),
	changeType: varchar("change_type", { length: 50 }).notNull(),
	changeReason: text("change_reason"),
	changedSubsections: jsonb("changed_subsections"),
	sourcePromptId: uuid("source_prompt_id"),
	aiResponseRaw: text("ai_response_raw"),
	brandId: varchar("brand_id", { length: 50 }).notNull(),
	metadata: jsonb(),
	createdBy: uuid("created_by").notNull(),
	createdByRole: varchar("created_by_role", { length: 50 }),
	isCurrentVersion: varchar("is_current_version", { length: 10 }).default('yes').notNull(),
	replacedAt: timestamp("replaced_at", { mode: 'string' }),
	replacedBy: uuid("replaced_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_layman_content_revisions_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_layman_content_revisions_current").using("btree", table.sectionId.asc().nullsLast().op("uuid_ops"), table.isCurrentVersion.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_content_revisions_parent_id").using("btree", table.parentRevisionId.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_content_revisions_prompt_id").using("btree", table.sourcePromptId.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_content_revisions_revision_number").using("btree", table.sectionId.asc().nullsLast().op("uuid_ops"), table.revisionNumber.asc().nullsLast().op("uuid_ops")),
	index("idx_layman_content_revisions_section_id").using("btree", table.sectionId.asc().nullsLast().op("uuid_ops")),
]);

export const tutorialContentVersions = pgTable("tutorial_content_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contentId: uuid("content_id").notNull(),
	version: integer().notNull(),
	content: jsonb().notNull(),
	savedBy: uuid("saved_by").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_content_versions_content_id").using("btree", table.contentId.asc().nullsLast().op("uuid_ops")),
]);

export const tutorialContentAudit = pgTable("tutorial_content_audit", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	contentId: uuid("content_id").notNull(),
	userId: uuid("user_id").notNull(),
	action: tutorialContentAuditAction().notNull(),
	diff: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_content_audit_content_id").using("btree", table.contentId.asc().nullsLast().op("uuid_ops")),
]);

export const tutorialDomains = pgTable("tutorial_domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	externalId: uuid("external_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("uq_tutorial_domains_external_id").using("btree", table.externalId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_domains_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const promptTemplates = pgTable("prompt_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectionType: sectionType("section_type").notNull(),
	subsectionType: subsectionType("subsection_type"),
	name: text().notNull(),
	version: integer().default(1).notNull(),
	systemPrompt: text("system_prompt").notNull(),
	userPromptTemplate: text("user_prompt_template").notNull(),
	variables: jsonb().notNull(),
	outputSchema: jsonb("output_schema").notNull(),
	validationRules: jsonb("validation_rules"),
	successCriteria: jsonb("success_criteria"),
	modelName: text("model_name").default('gpt-4').notNull(),
	temperature: integer().default(70).notNull(),
	maxTokens: integer("max_tokens").default(4000).notNull(),
	brandId: brand("brand_id").default('shared').notNull(),
	brandVisibility: brandVisibility("brand_visibility").default('shared_visible').notNull(),
	brandVariants: jsonb("brand_variants"),
	isActive: boolean("is_active").default(true).notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	successRate: integer("success_rate").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_prompt_brand").using("btree", table.brandId.asc().nullsLast().op("enum_ops")),
	index("idx_prompt_section").using("btree", table.sectionType.asc().nullsLast().op("enum_ops")),
	index("idx_prompt_subsection").using("btree", table.subsectionType.asc().nullsLast().op("enum_ops")),
	uniqueIndex("uq_prompt_section_subsection_version_brand").using("btree", table.sectionType.asc().nullsLast().op("int4_ops"), table.subsectionType.asc().nullsLast().op("int4_ops"), table.version.asc().nullsLast().op("enum_ops"), table.brandId.asc().nullsLast().op("int4_ops")),
]);

export const tutorialAssignments = pgTable("tutorial_assignments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	difficulty: tutorialDifficulty().notNull(),
	questionType: assignmentQuestionType("question_type").notNull(),
	question: text().default(').notNull(),
	hints: jsonb().default([]).notNull(),
	referenceAnswer: text("reference_answer").default(').notNull(),
	title: text().default(').notNull(),
	content: jsonb().notNull(),
	orderIndex: integer("order_index"),
	points: integer().default(10).notNull(),
	timeLimitSec: integer("time_limit_sec"),
	isPublished: boolean("is_published").default(false).notNull(),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_assignments_subtopic_diff").using("btree", table.subtopicId.asc().nullsLast().op("uuid_ops"), table.difficulty.asc().nullsLast().op("uuid_ops")),
]);

export const liveSessionRequests = pgTable("live_session_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	doubtText: text("doubt_text"),
	status: liveSessionRequestStatus().default('pending').notNull(),
	facultyId: uuid("faculty_id"),
	meetingLink: text("meeting_link"),
	scheduledAt: timestamp("scheduled_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	cancelledReason: text("cancelled_reason"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_session_requests_faculty").using("btree", table.facultyId.asc().nullsLast().op("uuid_ops")),
	index("idx_session_requests_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_session_requests_student").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
]);

export const tutorialTopics = pgTable("tutorial_topics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	externalId: uuid("external_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tutorial_topics_subject_id").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_topics_external_id").using("btree", table.externalId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_topics_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [tutorialSubjects.id],
			name: "tutorial_topics_subject_id_tutorial_subjects_id_fk"
		}),
]);

export const tutorialProjects = pgTable("tutorial_projects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	scope: tutorialProjectScope().notNull(),
	parentId: uuid("parent_id").notNull(),
	level: tutorialProjectLevel().notNull(),
	title: text().notNull(),
	description: text(),
	deliverableType: tutorialDeliverableType("deliverable_type").notNull(),
	evaluationType: tutorialEvaluationType("evaluation_type").notNull(),
	estimatedHours: integer("estimated_hours"),
	badgeId: uuid("badge_id"),
	subtopicsCovered: jsonb("subtopics_covered").default([]).notNull(),
	prerequisites: jsonb().default([]).notNull(),
	isPublished: boolean("is_published").default(false).notNull(),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_tutorial_projects_scope").using("btree", table.scope.asc().nullsLast().op("enum_ops"), table.level.asc().nullsLast().op("enum_ops")),
]);

export const tutorialSubjects = pgTable("tutorial_subjects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	externalId: uuid("external_id").notNull(),
	domainId: uuid("domain_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tutorial_subjects_domain_id").using("btree", table.domainId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_subjects_external_id").using("btree", table.externalId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_subjects_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.domainId],
			foreignColumns: [tutorialDomains.id],
			name: "tutorial_subjects_domain_id_tutorial_domains_id_fk"
		}),
]);

export const studentBadges = pgTable("student_badges", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	badgeId: uuid("badge_id").notNull(),
	awardedAt: timestamp("awarded_at", { mode: 'string' }).defaultNow().notNull(),
	projectSubmissionId: uuid("project_submission_id"),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("uq_student_badges_user_badge").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.badgeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.badgeId],
			foreignColumns: [badges.id],
			name: "student_badges_badge_id_badges_id_fk"
		}),
	foreignKey({
			columns: [table.projectSubmissionId],
			foreignColumns: [tutorialProjectSubmissions.id],
			name: "student_badges_project_submission_id_tutorial_project_submissio"
		}),
]);

export const tutorialProgress = pgTable("tutorial_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	status: tutorialProgressStatus().default('not_started').notNull(),
	blocksCompleted: jsonb("blocks_completed").default([]).notNull(),
	remediationTriggered: boolean("remediation_triggered").default(false).notNull(),
	score: numeric({ precision: 5, scale:  2 }),
	timeSpentSec: integer("time_spent_sec").default(0).notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_tutorial_progress_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_progress_user_subtopic").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.subtopicId.asc().nullsLast().op("uuid_ops")),
]);

export const remediationTriggers = pgTable("remediation_triggers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	examResultId: uuid("exam_result_id").notNull(),
	userId: uuid("user_id").notNull(),
	weakSubtopics: jsonb("weak_subtopics").default([]).notNull(),
	weakSubtopicIds: jsonb("weak_subtopic_ids").default([]).notNull(),
	recommendedContentTypes: jsonb("recommended_content_types").default([]).notNull(),
	status: tutorialTriggerStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_remediation_triggers_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("uuid_ops")),
]);

export const subtopicFlowProgress = pgTable("subtopic_flow_progress", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	laymanReadAt: timestamp("layman_read_at", { mode: 'string' }),
	realLifeReadAt: timestamp("real_life_read_at", { mode: 'string' }),
	technicalReadAt: timestamp("technical_read_at", { mode: 'string' }),
	codeReadAt: timestamp("code_read_at", { mode: 'string' }),
	aiTutorFirstMessageAt: timestamp("ai_tutor_first_message_at", { mode: 'string' }),
	assignmentUnlockedAt: timestamp("assignment_unlocked_at", { mode: 'string' }),
	assignmentCompletedAt: timestamp("assignment_completed_at", { mode: 'string' }),
	currentFlowStep: integer("current_flow_step").default(1).notNull(),
	flowCompleted: boolean("flow_completed").default(false).notNull(),
	timeOnLaymanSeconds: integer("time_on_layman_seconds").default(0).notNull(),
	timeOnTechnicalSeconds: integer("time_on_technical_seconds").default(0).notNull(),
	timeOnCodeSeconds: integer("time_on_code_seconds").default(0).notNull(),
	totalTimeSeconds: integer("total_time_seconds").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_subtopic_flow_progress_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_subtopic_flow_progress_user_subtopic").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.subtopicId.asc().nullsLast().op("uuid_ops")),
]);

export const tutorialSubtopics = pgTable("tutorial_subtopics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	externalId: uuid("external_id").notNull(),
	topicId: uuid("topic_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	difficultyLevels: jsonb("difficulty_levels").default([]).notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tutorial_subtopics_topic_id").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_subtopics_external_id").using("btree", table.externalId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_subtopics_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [tutorialTopics.id],
			name: "tutorial_subtopics_topic_id_tutorial_topics_id_fk"
		}),
]);

export const studentStreaks = pgTable("student_streaks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	currentStreak: integer("current_streak").default(0).notNull(),
	longestStreak: integer("longest_streak").default(0).notNull(),
	lastActivity: timestamp("last_activity", { mode: 'string' }),
	totalXp: integer("total_xp").default(0).notNull(),
	level: text().default('bronze').notNull(),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	uniqueIndex("uq_student_streaks_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
]);

export const tutorialProjectSubmissions = pgTable("tutorial_project_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	projectId: uuid("project_id").notNull(),
	projectLevel: tutorialProjectLevel("project_level").notNull(),
	difficulty: tutorialDifficulty().notNull(),
	submissionContent: jsonb("submission_content").notNull(),
	status: tutorialProjectSubmissionStatus().default('pending').notNull(),
	score: integer(),
	feedback: text(),
	aiReview: jsonb("ai_review").default(null),
	peerReviews: jsonb("peer_reviews").default([]).notNull(),
	adminReview: jsonb("admin_review").default(null),
	badgeAwarded: boolean("badge_awarded").default(false).notNull(),
	videoRequired: boolean("video_required").default(false).notNull(),
	videoUrl: text("video_url"),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	gradedAt: timestamp("graded_at", { mode: 'string' }),
	version: integer().default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	index("idx_tutorial_project_submissions_project").using("btree", table.projectId.asc().nullsLast().op("uuid_ops")),
	index("idx_tutorial_project_submissions_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_tutorial_project_submissions_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.projectId],
			foreignColumns: [tutorialProjects.id],
			name: "tutorial_project_submissions_project_id_tutorial_projects_id_fk"
		}),
]);

export const tutorialSidebarTreesV2 = pgTable("tutorial_sidebar_trees_v2", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	domainId: uuid("domain_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	topicId: uuid("topic_id").notNull(),
	activeSubtopicId: uuid("active_subtopic_id"),
	tree: jsonb().notNull(),
	sourceFormat: text("source_format").default('json').notNull(),
	sourceContent: text("source_content").notNull(),
	status: text().default('draft').notNull(),
	version: integer().default(1).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tutorial_sidebar_trees_v2_scope").using("btree", table.brandId.asc().nullsLast().op("text_ops"), table.domainId.asc().nullsLast().op("text_ops"), table.subjectId.asc().nullsLast().op("uuid_ops"), table.topicId.asc().nullsLast().op("text_ops")),
	uniqueIndex("uq_tutorial_sidebar_trees_v2_scope").using("btree", table.brandId.asc().nullsLast().op("uuid_ops"), table.topicId.asc().nullsLast().op("uuid_ops")),
]);

export const domains = pgTable("domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: domainCategory().notNull(),
	status: entityStatus().default('active').notNull(),
	order: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("domains_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	uniqueIndex("domains_name_unique").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("domains_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("domains_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const subjects = pgTable("subjects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	domainId: uuid("domain_id").notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0).notNull(),
	status: entityStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("subjects_domain_idx").using("btree", table.domainId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("subjects_domain_name_unique").using("btree", table.domainId.asc().nullsLast().op("text_ops"), table.name.asc().nullsLast().op("uuid_ops")),
	index("subjects_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("subjects_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.domainId],
			foreignColumns: [domains.id],
			name: "subjects_domain_id_fk"
		}),
]);

export const topics = pgTable("topics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subjectId: uuid("subject_id").notNull(),
	name: text().notNull(),
	description: text(),
	complexity: topicComplexity().default('beginner').notNull(),
	weight: numeric({ precision: 3, scale:  2 }).default('1.00').notNull(),
	order: integer().default(0).notNull(),
	status: entityStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("topics_complexity_idx").using("btree", table.complexity.asc().nullsLast().op("enum_ops")),
	index("topics_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("topics_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("topics_subject_idx").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("topics_subject_name_unique").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops"), table.name.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "topics_subject_id_fk"
		}),
]);

export const subtopics = pgTable("subtopics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	topicId: uuid("topic_id").notNull(),
	name: text().notNull(),
	description: text(),
	depth: integer().default(1).notNull(),
	order: integer().default(0).notNull(),
	status: entityStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("subtopics_depth_idx").using("btree", table.depth.asc().nullsLast().op("int4_ops")),
	index("subtopics_order_idx").using("btree", table.order.asc().nullsLast().op("int4_ops")),
	index("subtopics_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("subtopics_topic_idx").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("subtopics_topic_name_unique").using("btree", table.topicId.asc().nullsLast().op("uuid_ops"), table.name.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "subtopics_topic_id_fk"
		}),
]);

export const skills = pgTable("skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: skillCategory().notNull(),
	weight: numeric({ precision: 3, scale:  2 }).default('1.00').notNull(),
	status: entityStatus().default('active').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("skills_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	uniqueIndex("skills_name_unique").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("skills_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const tutorialPageContentV2 = pgTable("tutorial_page_content_v2", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	brandId: text("brand_id").notNull(),
	domainId: uuid("domain_id").notNull(),
	subjectId: uuid("subject_id").notNull(),
	topicId: uuid("topic_id").notNull(),
	subtopicId: uuid("subtopic_id").notNull(),
	contentType: text("content_type").notNull(),
	payload: jsonb().notNull(),
	sourceFormat: text("source_format").default('json').notNull(),
	sourceContent: text("source_content").notNull(),
	status: text().default('draft').notNull(),
	version: integer().default(1).notNull(),
	publishedAt: timestamp("published_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_tutorial_page_content_v2_scope").using("btree", table.brandId.asc().nullsLast().op("text_ops"), table.domainId.asc().nullsLast().op("uuid_ops"), table.subjectId.asc().nullsLast().op("uuid_ops"), table.topicId.asc().nullsLast().op("text_ops"), table.subtopicId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_tutorial_page_content_v2_scope").using("btree", table.brandId.asc().nullsLast().op("uuid_ops"), table.subtopicId.asc().nullsLast().op("text_ops"), table.contentType.asc().nullsLast().op("text_ops")),
]);

export const topicSkills = pgTable("topic_skills", {
	topicId: uuid("topic_id").notNull(),
	skillId: uuid("skill_id").notNull(),
	relevance: numeric({ precision: 3, scale:  2 }).default('0.50').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("topic_skills_skill_idx").using("btree", table.skillId.asc().nullsLast().op("uuid_ops")),
	index("topic_skills_topic_idx").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "topic_skills_topic_id_fk"
		}),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "topic_skills_skill_id_fk"
		}),
	primaryKey({ columns: [table.topicId, table.skillId], name: "topic_skills_topic_id_skill_id_pk"}),
]);
