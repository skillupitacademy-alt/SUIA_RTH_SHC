import { relations } from "drizzle-orm/relations";
import { users, loginAttempts, sessions, refreshTokens, userProfiles, subjects, topics, auditLogs, domains, subtopics, questions, skills, verificationTokens, exams, resultsByDimension, idempotencyKeys, passwordResetTokens, examBlueprints, examQuestions, automationAliases, automationFeatureFlags, automationPolicies, automationTelemetry, backgroundJobs, userRoles, roles, topicSkills, questionSkills } from "./schema";

export const loginAttemptsRelations = relations(loginAttempts, ({one}) => ({
	user: one(users, {
		fields: [loginAttempts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	loginAttempts: many(loginAttempts),
	sessions: many(sessions),
	refreshTokens: many(refreshTokens),
	userProfiles: many(userProfiles),
	auditLogs: many(auditLogs),
	verificationTokens: many(verificationTokens),
	idempotencyKeys: many(idempotencyKeys),
	passwordResetTokens: many(passwordResetTokens),
	exams: many(exams),
	automationAliases: many(automationAliases),
	automationFeatureFlags: many(automationFeatureFlags),
	automationPolicies: many(automationPolicies),
	automationTelemetries: many(automationTelemetry),
	backgroundJobs: many(backgroundJobs),
	userRoles: many(userRoles),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const refreshTokensRelations = relations(refreshTokens, ({one}) => ({
	user: one(users, {
		fields: [refreshTokens.userId],
		references: [users.id]
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({one}) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id]
	}),
}));

export const topicsRelations = relations(topics, ({one, many}) => ({
	subject: one(subjects, {
		fields: [topics.subjectId],
		references: [subjects.id]
	}),
	subtopics: many(subtopics),
	questions: many(questions),
	topicSkills: many(topicSkills),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	topics: many(topics),
	domain: one(domains, {
		fields: [subjects.domainId],
		references: [domains.id]
	}),
}));

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const domainsRelations = relations(domains, ({many}) => ({
	subjects: many(subjects),
}));

export const subtopicsRelations = relations(subtopics, ({one, many}) => ({
	topic: one(topics, {
		fields: [subtopics.topicId],
		references: [topics.id]
	}),
	questions: many(questions),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	topic: one(topics, {
		fields: [questions.topicId],
		references: [topics.id]
	}),
	subtopic: one(subtopics, {
		fields: [questions.subtopicId],
		references: [subtopics.id]
	}),
	skill: one(skills, {
		fields: [questions.skillId],
		references: [skills.id]
	}),
	examQuestions: many(examQuestions),
	questionSkills: many(questionSkills),
}));

export const skillsRelations = relations(skills, ({many}) => ({
	questions: many(questions),
	topicSkills: many(topicSkills),
	questionSkills: many(questionSkills),
}));

export const verificationTokensRelations = relations(verificationTokens, ({one}) => ({
	user: one(users, {
		fields: [verificationTokens.userId],
		references: [users.id]
	}),
}));

export const resultsByDimensionRelations = relations(resultsByDimension, ({one}) => ({
	exam: one(exams, {
		fields: [resultsByDimension.examId],
		references: [exams.id]
	}),
}));

export const examsRelations = relations(exams, ({one, many}) => ({
	resultsByDimensions: many(resultsByDimension),
	idempotencyKeys: many(idempotencyKeys),
	user: one(users, {
		fields: [exams.userId],
		references: [users.id]
	}),
	examBlueprint: one(examBlueprints, {
		fields: [exams.blueprintId],
		references: [examBlueprints.id]
	}),
	examQuestions: many(examQuestions),
	automationPolicies: many(automationPolicies),
}));

export const idempotencyKeysRelations = relations(idempotencyKeys, ({one}) => ({
	user: one(users, {
		fields: [idempotencyKeys.userId],
		references: [users.id]
	}),
	exam: one(exams, {
		fields: [idempotencyKeys.examId],
		references: [exams.id]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.id]
	}),
}));

export const examBlueprintsRelations = relations(examBlueprints, ({many}) => ({
	exams: many(exams),
}));

export const examQuestionsRelations = relations(examQuestions, ({one}) => ({
	exam: one(exams, {
		fields: [examQuestions.examId],
		references: [exams.id]
	}),
	question: one(questions, {
		fields: [examQuestions.questionId],
		references: [questions.id]
	}),
}));

export const automationAliasesRelations = relations(automationAliases, ({one}) => ({
	user: one(users, {
		fields: [automationAliases.createdBy],
		references: [users.id]
	}),
}));

export const automationFeatureFlagsRelations = relations(automationFeatureFlags, ({one}) => ({
	user: one(users, {
		fields: [automationFeatureFlags.updatedBy],
		references: [users.id]
	}),
}));

export const automationPoliciesRelations = relations(automationPolicies, ({one}) => ({
	exam: one(exams, {
		fields: [automationPolicies.defaultExamId],
		references: [exams.id]
	}),
	user: one(users, {
		fields: [automationPolicies.updatedBy],
		references: [users.id]
	}),
}));

export const automationTelemetryRelations = relations(automationTelemetry, ({one}) => ({
	user: one(users, {
		fields: [automationTelemetry.userId],
		references: [users.id]
	}),
}));

export const backgroundJobsRelations = relations(backgroundJobs, ({one}) => ({
	user: one(users, {
		fields: [backgroundJobs.userId],
		references: [users.id]
	}),
}));

export const userRolesRelations = relations(userRoles, ({one}) => ({
	user: one(users, {
		fields: [userRoles.userId],
		references: [users.id]
	}),
	role: one(roles, {
		fields: [userRoles.roleId],
		references: [roles.id]
	}),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	userRoles: many(userRoles),
}));

export const topicSkillsRelations = relations(topicSkills, ({one}) => ({
	topic: one(topics, {
		fields: [topicSkills.topicId],
		references: [topics.id]
	}),
	skill: one(skills, {
		fields: [topicSkills.skillId],
		references: [skills.id]
	}),
}));

export const questionSkillsRelations = relations(questionSkills, ({one}) => ({
	question: one(questions, {
		fields: [questionSkills.questionId],
		references: [questions.id]
	}),
	skill: one(skills, {
		fields: [questionSkills.skillId],
		references: [skills.id]
	}),
}));