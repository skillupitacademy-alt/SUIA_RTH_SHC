import { relations } from "drizzle-orm/relations";
import { educationalArchitectures, educationalArchitecturePerformance, promptTemplates, promptTemplatePerformance, uiArchitectures, uiArchitecturePerformance, tutorialSubtopics, aiGenerationOrchestration, tutorialSections, tutorialAssignments, assignmentHelpRequests, tutorialSubjects, tutorialTopics, tutorialDomains, badges, studentBadges, tutorialProjectSubmissions, tutorialProjects, domains, subjects, topics, subtopics, topicSkills, skills } from "./schema";

export const educationalArchitecturePerformanceRelations = relations(educationalArchitecturePerformance, ({one}) => ({
	educationalArchitecture: one(educationalArchitectures, {
		fields: [educationalArchitecturePerformance.architectureId],
		references: [educationalArchitectures.id]
	}),
}));

export const educationalArchitecturesRelations = relations(educationalArchitectures, ({many}) => ({
	educationalArchitecturePerformances: many(educationalArchitecturePerformance),
	aiGenerationOrchestrations: many(aiGenerationOrchestration),
	tutorialSections: many(tutorialSections),
}));

export const promptTemplatePerformanceRelations = relations(promptTemplatePerformance, ({one}) => ({
	promptTemplate: one(promptTemplates, {
		fields: [promptTemplatePerformance.templateId],
		references: [promptTemplates.id]
	}),
}));

export const promptTemplatesRelations = relations(promptTemplates, ({many}) => ({
	promptTemplatePerformances: many(promptTemplatePerformance),
	tutorialSections: many(tutorialSections),
}));

export const uiArchitecturePerformanceRelations = relations(uiArchitecturePerformance, ({one}) => ({
	uiArchitecture: one(uiArchitectures, {
		fields: [uiArchitecturePerformance.architectureId],
		references: [uiArchitectures.id]
	}),
}));

export const uiArchitecturesRelations = relations(uiArchitectures, ({many}) => ({
	uiArchitecturePerformances: many(uiArchitecturePerformance),
	tutorialSections: many(tutorialSections),
}));

export const aiGenerationOrchestrationRelations = relations(aiGenerationOrchestration, ({one}) => ({
	tutorialSubtopic: one(tutorialSubtopics, {
		fields: [aiGenerationOrchestration.subtopicId],
		references: [tutorialSubtopics.id]
	}),
	educationalArchitecture: one(educationalArchitectures, {
		fields: [aiGenerationOrchestration.educationalArchitectureId],
		references: [educationalArchitectures.id]
	}),
}));

export const tutorialSubtopicsRelations = relations(tutorialSubtopics, ({one, many}) => ({
	aiGenerationOrchestrations: many(aiGenerationOrchestration),
	tutorialSections: many(tutorialSections),
	tutorialTopic: one(tutorialTopics, {
		fields: [tutorialSubtopics.topicId],
		references: [tutorialTopics.id]
	}),
}));

export const tutorialSectionsRelations = relations(tutorialSections, ({one}) => ({
	tutorialSubtopic: one(tutorialSubtopics, {
		fields: [tutorialSections.subtopicId],
		references: [tutorialSubtopics.id]
	}),
	promptTemplate: one(promptTemplates, {
		fields: [tutorialSections.promptTemplateId],
		references: [promptTemplates.id]
	}),
	educationalArchitecture: one(educationalArchitectures, {
		fields: [tutorialSections.educationalArchitectureId],
		references: [educationalArchitectures.id]
	}),
	uiArchitecture: one(uiArchitectures, {
		fields: [tutorialSections.uiArchitectureId],
		references: [uiArchitectures.id]
	}),
}));

export const assignmentHelpRequestsRelations = relations(assignmentHelpRequests, ({one}) => ({
	tutorialAssignment: one(tutorialAssignments, {
		fields: [assignmentHelpRequests.assignmentId],
		references: [tutorialAssignments.id]
	}),
}));

export const tutorialAssignmentsRelations = relations(tutorialAssignments, ({many}) => ({
	assignmentHelpRequests: many(assignmentHelpRequests),
}));

export const tutorialTopicsRelations = relations(tutorialTopics, ({one, many}) => ({
	tutorialSubject: one(tutorialSubjects, {
		fields: [tutorialTopics.subjectId],
		references: [tutorialSubjects.id]
	}),
	tutorialSubtopics: many(tutorialSubtopics),
}));

export const tutorialSubjectsRelations = relations(tutorialSubjects, ({one, many}) => ({
	tutorialTopics: many(tutorialTopics),
	tutorialDomain: one(tutorialDomains, {
		fields: [tutorialSubjects.domainId],
		references: [tutorialDomains.id]
	}),
}));

export const tutorialDomainsRelations = relations(tutorialDomains, ({many}) => ({
	tutorialSubjects: many(tutorialSubjects),
}));

export const studentBadgesRelations = relations(studentBadges, ({one}) => ({
	badge: one(badges, {
		fields: [studentBadges.badgeId],
		references: [badges.id]
	}),
	tutorialProjectSubmission: one(tutorialProjectSubmissions, {
		fields: [studentBadges.projectSubmissionId],
		references: [tutorialProjectSubmissions.id]
	}),
}));

export const badgesRelations = relations(badges, ({many}) => ({
	studentBadges: many(studentBadges),
}));

export const tutorialProjectSubmissionsRelations = relations(tutorialProjectSubmissions, ({one, many}) => ({
	studentBadges: many(studentBadges),
	tutorialProject: one(tutorialProjects, {
		fields: [tutorialProjectSubmissions.projectId],
		references: [tutorialProjects.id]
	}),
}));

export const tutorialProjectsRelations = relations(tutorialProjects, ({many}) => ({
	tutorialProjectSubmissions: many(tutorialProjectSubmissions),
}));

export const subjectsRelations = relations(subjects, ({one, many}) => ({
	domain: one(domains, {
		fields: [subjects.domainId],
		references: [domains.id]
	}),
	topics: many(topics),
}));

export const domainsRelations = relations(domains, ({many}) => ({
	subjects: many(subjects),
}));

export const topicsRelations = relations(topics, ({one, many}) => ({
	subject: one(subjects, {
		fields: [topics.subjectId],
		references: [subjects.id]
	}),
	subtopics: many(subtopics),
	topicSkills: many(topicSkills),
}));

export const subtopicsRelations = relations(subtopics, ({one}) => ({
	topic: one(topics, {
		fields: [subtopics.topicId],
		references: [topics.id]
	}),
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

export const skillsRelations = relations(skills, ({many}) => ({
	topicSkills: many(topicSkills),
}));