import { relations } from 'drizzle-orm';
import { domains, subjects, topics, subtopics, skills, topicSkills } from './domain';

// Domain relations
export const domainsRelations = relations(domains, ({ many }) => ({
  subjects: many(subjects),
}));

// Subject relations
export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  domain: one(domains, {
    fields: [subjects.domainId],
    references: [domains.id],
  }),
  topics: many(topics),
}));

// Topic relations
export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  subtopics: many(subtopics),
  skills: many(topicSkills),
}));

// Subtopic relations
export const subtopicsRelations = relations(subtopics, ({ one }) => ({
  topic: one(topics, {
    fields: [subtopics.topicId],
    references: [topics.id],
  }),
}));

// Skill relations
export const skillsRelations = relations(skills, ({ many }) => ({
  topics: many(topicSkills),
}));

// TopicSkills relations (many-to-many)
export const topicSkillsRelations = relations(topicSkills, ({ one }) => ({
  topic: one(topics, {
    fields: [topicSkills.topicId],
    references: [topics.id],
  }),
  skill: one(skills, {
    fields: [topicSkills.skillId],
    references: [skills.id],
  }),
}));