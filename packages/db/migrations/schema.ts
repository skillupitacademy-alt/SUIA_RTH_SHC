import { pgTable, index, foreignKey, uuid, text, integer, timestamp, unique, boolean, jsonb, uniqueIndex, varchar, numeric, primaryKey, pgMaterializedView, bigint, doublePrecision, date, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const difficulty = pgEnum("difficulty", ['simple', 'intermediate', 'expert'])
export const examStatus = pgEnum("exam_status", ['started', 'processing', 'completed', 'abandoned', 'failed'])
export const jobStatus = pgEnum("job_status", ['pending', 'processing', 'completed', 'failed'])
export const mappingType = pgEnum("mapping_type", ['conceptual', 'technical', 'practical'])
export const questionType = pgEnum("question_type", ['mcq', 'code_mcq', 'multi_select'])
export const skillCategory = pgEnum("skill_category", ['technical', 'cognitive', 'process'])
export const status = pgEnum("status", ['active', 'inactive', 'draft'])


export const loginAttempts = pgTable("login_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	ip: text().notNull(),
	attempts: integer().default(0).notNull(),
	lockedUntil: timestamp("locked_until", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_login_attempts_ip").using("btree", table.ip.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "login_attempts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	passwordHash: text("password_hash").notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	isBlocked: boolean("is_blocked").default(false).notNull(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { mode: 'string' }),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	ip: text(),
	device: text(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const revokedTokens = pgTable("revoked_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tokenHash: text("token_hash").notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("revoked_tokens_token_hash_unique").on(table.tokenHash),
]);

export const refreshTokens = pgTable("refresh_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	revoked: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_refresh_tokens_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "refresh_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("refresh_tokens_token_unique").on(table.token),
]);

export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	name: text().notNull(),
	educationLevel: text("education_level"),
	professionalStatus: text("professional_status"),
	ageGroup: text("age_group"),
	experienceYears: integer("experience_years"),
	domainInterest: text("domain_interest").array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_profiles_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const roles = pgTable("roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	unique("roles_name_unique").on(table.name),
]);

export const skills = pgTable("skills", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	category: skillCategory(),
	mappingType: mappingType("mapping_type"),
	weight: integer().default(1).notNull(),
}, (table) => [
	unique("skills_name_unique").on(table.name),
]);

export const topics = pgTable("topics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	subjectId: uuid("subject_id").notNull(),
	name: text().notNull(),
	description: text(),
	complexityLevel: integer("complexity_level").default(1).notNull(),
	weight: integer().default(1).notNull(),
	status: status().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	learningUrl: text("learning_url"),
	detailedNotesPath: text("detailed_notes_path"),
}, (table) => [
	index("idx_topics_subject_id").using("btree", table.subjectId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "topics_subject_id_subjects_id_fk"
		}).onDelete("cascade"),
]);

export const auditLogs = pgTable("audit_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	action: text().notNull(),
	ip: text(),
	device: text(),
	metadata: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_audit_logs_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "audit_logs_user_id_users_id_fk"
		}).onDelete("set null"),
]);

export const subjects = pgTable("subjects", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	domainId: uuid("domain_id").notNull(),
	name: text().notNull(),
	description: text(),
	order: integer().default(0).notNull(),
	status: status().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_subjects_domain_id").using("btree", table.domainId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.domainId],
			foreignColumns: [domains.id],
			name: "subjects_domain_id_domains_id_fk"
		}).onDelete("cascade"),
]);

export const subtopics = pgTable("subtopics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	topicId: uuid("topic_id").notNull(),
	name: text().notNull(),
	description: text(),
	depthLevel: integer("depth_level").default(1).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_subtopics_topic_id").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "subtopics_topic_id_topics_id_fk"
		}).onDelete("cascade"),
]);

export const questions = pgTable("questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	topicId: uuid("topic_id").notNull(),
	difficulty: difficulty().notNull(),
	type: questionType().default('mcq').notNull(),
	questionText: text("question_text").notNull(),
	options: jsonb().notNull(),
	correctAnswer: text("correct_answer").notNull(),
	explanation: text(),
	codeSnippet: text("code_snippet"),
	metadata: jsonb(),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	status: status().default('active').notNull(),
	subtopicId: uuid("subtopic_id"),
	skillId: uuid("skill_id"),
	mappingType: mappingType("mapping_type"),
}, (table) => [
	index("idx_questions_active_partial").using("btree", table.id.asc().nullsLast().op("uuid_ops")).where(sql`(status = 'active'::status)`),
	index("idx_questions_difficulty").using("btree", table.difficulty.asc().nullsLast().op("enum_ops")),
	index("idx_questions_selection_filter").using("btree", table.topicId.asc().nullsLast().op("enum_ops"), table.subtopicId.asc().nullsLast().op("uuid_ops"), table.difficulty.asc().nullsLast().op("enum_ops")),
	index("idx_questions_topic_id").using("btree", table.topicId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "questions_topic_id_topics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.subtopicId],
			foreignColumns: [subtopics.id],
			name: "questions_subtopic_id_subtopics_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "questions_skill_id_skills_id_fk"
		}).onDelete("set null"),
]);

export const verificationTokens = pgTable("verification_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "verification_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("verification_tokens_token_unique").on(table.token),
]);

export const examBlueprints = pgTable("exam_blueprints", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	domainIds: uuid("domain_ids").array(),
	subjectIds: uuid("subject_ids").array(),
	topicIds: uuid("topic_ids").array(),
	totalQuestions: integer("total_questions").default(10).notNull(),
	timeLimit: integer("time_limit"),
	difficultyDistribution: jsonb("difficulty_distribution").default({"expert":40,"simple":30,"intermediate":30}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	subtopicIds: uuid("subtopic_ids").array(),
	questionIds: uuid("question_ids").array(),
});

export const resultsByDimension = pgTable("results_by_dimension", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	examId: uuid("exam_id").notNull(),
	dimensionType: text("dimension_type").notNull(),
	dimensionId: text("dimension_id"),
	score: integer().notNull(),
	accuracy: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	name: text(),
}, (table) => [
	index("idx_results_dimension_type").using("btree", table.dimensionType.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "results_by_dimension_exam_id_exams_id_fk"
		}).onDelete("cascade"),
]);

export const idempotencyKeys = pgTable("idempotency_keys", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	key: text().notNull(),
	examId: uuid("exam_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("unq_user_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.key.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "idempotency_keys_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "idempotency_keys_exam_id_exams_id_fk"
		}).onDelete("cascade"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_unique").on(table.token),
]);

export const exams = pgTable("exams", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	blueprintId: uuid("blueprint_id"),
	status: examStatus().default('started').notNull(),
	totalScore: integer("total_score"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow().notNull(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	durationSeconds: integer("duration_seconds"),
	lastAnsweredAt: timestamp("last_answered_at", { mode: 'string' }),
	exportUrls: jsonb("export_urls"),
}, (table) => [
	index("idx_exams_dashboard_opt").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.status.asc().nullsLast().op("enum_ops"), table.completedAt.desc().nullsFirst().op("enum_ops")),
	index("idx_exams_user_id_status").using("btree", table.userId.asc().nullsLast().op("enum_ops"), table.status.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "exams_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.blueprintId],
			foreignColumns: [examBlueprints.id],
			name: "exams_blueprint_id_exam_blueprints_id_fk"
		}).onDelete("set null"),
]);

export const domains = pgTable("domains", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	category: text(),
	status: status().default('active').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("domains_name_unique").on(table.name),
]);

export const examQuestions = pgTable("exam_questions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	examId: uuid("exam_id").notNull(),
	questionId: uuid("question_id").notNull(),
	userAnswer: text("user_answer"),
	isCorrect: boolean("is_correct"),
	responseMetadata: jsonb("response_metadata"),
	order: integer().notNull(),
}, (table) => [
	index("idx_exam_questions_exam_id").using("btree", table.examId.asc().nullsLast().op("uuid_ops")),
	index("idx_exam_questions_exam_order").using("btree", table.examId.asc().nullsLast().op("int4_ops"), table.order.asc().nullsLast().op("int4_ops")),
	index("idx_exam_questions_question_id").using("btree", table.questionId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unq_exam_order").using("btree", table.examId.asc().nullsLast().op("uuid_ops"), table.order.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("unq_exam_question").using("btree", table.examId.asc().nullsLast().op("uuid_ops"), table.questionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "exam_questions_exam_id_exams_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "exam_questions_question_id_questions_id_fk"
		}).onDelete("cascade"),
]);

export const automationRbacSettings = pgTable("automation_rbac_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	enforceOwnership: boolean("enforce_ownership").default(true).notNull(),
	permissionsEndpoint: varchar("permissions_endpoint", { length: 255 }).default('/api/auth/verify-ownership').notNull(),
	fallbackBehavior: varchar("fallback_behavior", { length: 20 }).default('route_to_manual').notNull(),
	customRoles: jsonb("custom_roles").default({}).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const automationAliases = pgTable("automation_aliases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	canonical: varchar({ length: 255 }).notNull(),
	alias: varchar({ length: 255 }).notNull(),
	confidence: numeric({ precision: 3, scale:  2 }).default('0.90').notNull(),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "automation_aliases_created_by_users_id_fk"
		}),
]);

export const automationFeatureFlags = pgTable("automation_feature_flags", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	globalEnabled: boolean("global_enabled").default(false).notNull(),
	roleScoping: jsonb("role_scoping").default({"blockedUsers":[],"enabledRoles":[]}).notNull(),
	environmentToggles: jsonb("environment_toggles").default({"staging":true,"production":false,"development":true}).notNull(),
	killSwitch: boolean("kill_switch").default(false).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "automation_feature_flags_updated_by_users_id_fk"
		}),
]);

export const automationPolicies = pgTable("automation_policies", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	defaultExamId: uuid("default_exam_id"),
	dateRangeDays: integer("date_range_days").default(30).notNull(),
	difficulty: varchar({ length: 10 }).default('mixed').notNull(),
	questionCount: integer("question_count").default(20).notNull(),
	disambiguationTimeoutMs: integer("disambiguation_timeout_ms").default(30000).notNull(),
	levenshteinMaxDistance: integer("levenshtein_max_distance").default(2).notNull(),
	confidenceThreshold: numeric("confidence_threshold", { precision: 3, scale:  2 }).default('0.80').notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	updatedBy: uuid("updated_by"),
}, (table) => [
	foreignKey({
			columns: [table.defaultExamId],
			foreignColumns: [exams.id],
			name: "automation_policies_default_exam_id_exams_id_fk"
		}),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "automation_policies_updated_by_users_id_fk"
		}),
]);

export const automationTelemetry = pgTable("automation_telemetry", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	intent: text().notNull(),
	action: varchar({ length: 50 }),
	confidence: numeric({ precision: 3, scale:  2 }),
	status: varchar({ length: 20 }).notNull(),
	matchType: varchar("match_type", { length: 20 }),
	entityId: uuid("entity_id"),
	timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "automation_telemetry_user_id_users_id_fk"
		}),
]);

export const backgroundJobs = pgTable("background_jobs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	status: text().default('pending').notNull(),
	payload: jsonb(),
	result: jsonb(),
	error: text(),
	startedAt: timestamp("started_at", { mode: 'string' }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_jobs_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_jobs_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "background_jobs_user_id_fkey"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const userRoles = pgTable("user_roles", {
	userId: uuid("user_id").notNull(),
	roleId: uuid("role_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_roles_user_id_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "user_roles_role_id_roles_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.roleId], name: "user_roles_user_id_role_id_pk"}),
]);

export const topicSkills = pgTable("topic_skills", {
	topicId: uuid("topic_id").notNull(),
	skillId: uuid("skill_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "topic_skills_topic_id_topics_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "topic_skills_skill_id_skills_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.topicId, table.skillId], name: "topic_skills_topic_id_skill_id_pk"}),
]);

export const questionSkills = pgTable("question_skills", {
	questionId: uuid("question_id").notNull(),
	skillId: uuid("skill_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [questions.id],
			name: "question_skills_question_id_questions_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.skillId],
			foreignColumns: [skills.id],
			name: "question_skills_skill_id_skills_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.questionId, table.skillId], name: "question_skills_question_id_skill_id_pk"}),
]);
export const mvScoreDistribution = pgMaterializedView("mv_score_distribution", {	scoreBucket: integer("score_bucket"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	studentCount: bigint("student_count", { mode: "number" }),
}).as(sql`SELECT width_bucket(total_score::double precision, 0::double precision, 100::double precision, 10) AS score_bucket, count(*) AS student_count FROM exams WHERE total_score IS NOT NULL GROUP BY (width_bucket(total_score::double precision, 0::double precision, 100::double precision, 10)) ORDER BY (width_bucket(total_score::double precision, 0::double precision, 100::double precision, 10))`);

export const mvTimeBoxplot = pgMaterializedView("mv_time_boxplot", {	minTime: doublePrecision("min_time"),
	q1: doublePrecision(),
	median: doublePrecision(),
	q3: doublePrecision(),
	maxTime: doublePrecision("max_time"),
}).as(sql`SELECT percentile_cont(0.0::double precision) WITHIN GROUP (ORDER BY (((response_metadata ->> 'timeTakenSeconds'::text)::integer)::double precision)) AS min_time, percentile_cont(0.25::double precision) WITHIN GROUP (ORDER BY (((response_metadata ->> 'timeTakenSeconds'::text)::integer)::double precision)) AS q1, percentile_cont(0.5::double precision) WITHIN GROUP (ORDER BY (((response_metadata ->> 'timeTakenSeconds'::text)::integer)::double precision)) AS median, percentile_cont(0.75::double precision) WITHIN GROUP (ORDER BY (((response_metadata ->> 'timeTakenSeconds'::text)::integer)::double precision)) AS q3, percentile_cont(1.0::double precision) WITHIN GROUP (ORDER BY (((response_metadata ->> 'timeTakenSeconds'::text)::integer)::double precision)) AS max_time FROM exam_questions WHERE response_metadata ? 'timeTakenSeconds'::text`);

export const mvMasteryTrend = pgMaterializedView("mv_mastery_trend", {	examDate: date("exam_date"),
	avgAccuracy: numeric("avg_accuracy"),
}).as(sql`SELECT date(created_at) AS exam_date, avg(accuracy) AS avg_accuracy FROM results_by_dimension GROUP BY (date(created_at)) ORDER BY (date(created_at))`);

export const mvSkillPerformance = pgMaterializedView("mv_skill_performance", {	skillId: text("skill_id"),
	skillName: text("skill_name"),
	avgAccuracy: numeric("avg_accuracy"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	attemptCount: bigint("attempt_count", { mode: "number" }),
}).as(sql`SELECT dimension_id AS skill_id, name AS skill_name, avg(accuracy) AS avg_accuracy, count(*) AS attempt_count FROM results_by_dimension WHERE dimension_type = 'skill'::text GROUP BY dimension_id, name`);

export const mvTopicPerformance = pgMaterializedView("mv_topic_performance", {	topicId: text("topic_id"),
	topicName: text("topic_name"),
	avgAccuracy: numeric("avg_accuracy"),
}).as(sql`SELECT dimension_id AS topic_id, name AS topic_name, avg(accuracy) AS avg_accuracy FROM results_by_dimension WHERE dimension_type = 'topic'::text GROUP BY dimension_id, name`);

export const mvWeaknessTree = pgMaterializedView("mv_weakness_tree", {	dimensionType: text("dimension_type"),
	dimensionId: text("dimension_id"),
	name: text(),
	avgAccuracy: numeric("avg_accuracy"),
}).as(sql`SELECT dimension_type, dimension_id, name, avg(accuracy) AS avg_accuracy FROM results_by_dimension WHERE dimension_type = ANY (ARRAY['domain'::text, 'topic'::text, 'skill'::text]) GROUP BY dimension_type, dimension_id, name`);

export const mvDiscrimination = pgMaterializedView("mv_discrimination", {	questionId: uuid("question_id"),
	topAccuracy: numeric("top_accuracy"),
	bottomAccuracy: numeric("bottom_accuracy"),
}).as(sql`WITH ranked_exams AS ( SELECT exams.id, exams.total_score, ntile(100) OVER (ORDER BY exams.total_score DESC) AS percentile FROM exams WHERE exams.total_score IS NOT NULL ), top_exams AS ( SELECT ranked_exams.id FROM ranked_exams WHERE ranked_exams.percentile <= 27 ), bottom_exams AS ( SELECT ranked_exams.id FROM ranked_exams WHERE ranked_exams.percentile >= 73 ) SELECT q.id AS question_id, avg( CASE WHEN (eq.exam_id IN ( SELECT top_exams.id FROM top_exams)) AND eq.is_correct THEN 1 ELSE 0 END) AS top_accuracy, avg( CASE WHEN (eq.exam_id IN ( SELECT bottom_exams.id FROM bottom_exams)) AND eq.is_correct THEN 1 ELSE 0 END) AS bottom_accuracy FROM questions q LEFT JOIN exam_questions eq ON eq.question_id = q.id GROUP BY q.id`);

export const mvQuestionHierarchy = pgMaterializedView("mv_question_hierarchy", {	domainId: uuid("domain_id"),
	domain: text(),
	subjectId: uuid("subject_id"),
	subject: text(),
	topicId: uuid("topic_id"),
	topic: text(),
	subtopicId: uuid("subtopic_id"),
	subtopic: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	questionCount: bigint("question_count", { mode: "number" }),
}).as(sql`SELECT d.id AS domain_id, d.name AS domain, s.id AS subject_id, s.name AS subject, t.id AS topic_id, t.name AS topic, st.id AS subtopic_id, st.name AS subtopic, count(q.id) AS question_count FROM questions q LEFT JOIN subtopics st ON q.subtopic_id = st.id LEFT JOIN topics t ON q.topic_id = t.id LEFT JOIN subjects s ON t.subject_id = s.id LEFT JOIN domains d ON s.domain_id = d.id WHERE q.status = 'active'::status GROUP BY d.id, d.name, s.id, s.name, t.id, t.name, st.id, st.name`);

export const mvTopicSkillMatrix = pgMaterializedView("mv_topic_skill_matrix", {	topicId: uuid("topic_id"),
	topic: text(),
	skillId: uuid("skill_id"),
	skill: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	questionCount: bigint("question_count", { mode: "number" }),
}).as(sql`SELECT t.id AS topic_id, t.name AS topic, sk.id AS skill_id, sk.name AS skill, count(q.id) AS question_count FROM question_skills qs JOIN questions q ON q.id = qs.question_id JOIN skills sk ON sk.id = qs.skill_id JOIN topics t ON q.topic_id = t.id WHERE q.status = 'active'::status GROUP BY t.id, t.name, sk.id, sk.name`);

export const mvQuestionPool = pgMaterializedView("mv_question_pool", {	topicId: uuid("topic_id"),
	difficulty: difficulty(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	availableQuestions: bigint("available_questions", { mode: "number" }),
}).as(sql`SELECT topic_id, difficulty, count(*) AS available_questions FROM questions WHERE status = 'active'::status GROUP BY topic_id, difficulty`);

export const mvExamDifficultyActual = pgMaterializedView("mv_exam_difficulty_actual", {	blueprintId: uuid("blueprint_id"),
	difficulty: difficulty(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	questionCount: bigint("question_count", { mode: "number" }),
}).as(sql`SELECT e.blueprint_id, q.difficulty, count(*) AS question_count FROM exam_questions eq JOIN exams e ON eq.exam_id = e.id JOIN questions q ON eq.question_id = q.id GROUP BY e.blueprint_id, q.difficulty`);

export const mvItemDifficulty = pgMaterializedView("mv_item_difficulty", {	questionId: uuid("question_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	attemptCount: bigint("attempt_count", { mode: "number" }),
	accuracyPercent: numeric("accuracy_percent"),
}).as(sql`SELECT q.id AS question_id, count(eq.id) AS attempt_count, COALESCE(count(eq.id) FILTER (WHERE eq.is_correct)::numeric * 100.0 / NULLIF(count(eq.id), 0)::numeric, 0::numeric) AS accuracy_percent FROM questions q LEFT JOIN exam_questions eq ON eq.question_id = q.id GROUP BY q.id`);
