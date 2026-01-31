import { relations } from "drizzle-orm";
import { domains, subjects, topics, subtopics, skills, topicSkills } from "./domain";
import { questions, questionSkills } from "./question";

// --- DOMAIN RELATIONS ---

export const domainsRelations = relations(domains, ({ many }) => ({
  subjects: many(subjects),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  domain: one(domains, {
    fields: [subjects.domainId],
    references: [domains.id],
  }),
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subjectId],
    references: [subjects.id],
  }),
  subtopics: many(subtopics),
  topicSkills: many(topicSkills),
  questions: many(questions),
}));

export const subtopicsRelations = relations(subtopics, ({ one }) => ({
  topic: one(topics, {
    fields: [subtopics.topicId],
    references: [topics.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  topicSkills: many(topicSkills),
  questionSkills: many(questionSkills),
}));

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

// --- QUESTION RELATIONS ---

export const questionsRelations = relations(questions, ({ one, many }) => ({
  topic: one(topics, {
    fields: [questions.topicId],
    references: [topics.id],
  }),
  subtopic: one(subtopics, {
    fields: [questions.subtopicId],
    references: [subtopics.id],
  }),
  questionSkills: many(questionSkills),
}));

export const questionSkillsRelations = relations(questionSkills, ({ one }) => ({
    question: one(questions, {
      fields: [questionSkills.questionId],
      references: [questions.id],
    }),
    skill: one(skills, {
      fields: [questionSkills.skillId],
      references: [skills.id],
    }),
  }));
