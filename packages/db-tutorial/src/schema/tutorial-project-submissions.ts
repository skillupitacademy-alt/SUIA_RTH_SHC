import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

import { tutorialDifficultyEnum, tutorialProjectLevelEnum, tutorialProjectSubmissionStatusEnum } from './enums';
import { tutorialProjects } from './tutorial-projects';

export const tutorialProjectSubmissions = pgTable('tutorial_project_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  projectId: uuid('project_id').notNull().references(() => tutorialProjects.id),
  projectLevel: tutorialProjectLevelEnum('project_level').notNull(),
  difficulty: tutorialDifficultyEnum('difficulty').notNull(),
  submissionContent: jsonb('submission_content').notNull(),
  status: tutorialProjectSubmissionStatusEnum('status').notNull().default('pending'),
  score: integer('score'),
  feedback: text('feedback'),
  videoRequired: boolean('video_required').notNull().default(false),
  videoUrl: text('video_url'),
  submittedAt: timestamp('submitted_at', { mode: 'date' }),
  gradedAt: timestamp('graded_at', { mode: 'date' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxTutorialProjectSubmissionsUser: index('idx_tutorial_project_submissions_user').on(table.userId),
  idxTutorialProjectSubmissionsProject: index('idx_tutorial_project_submissions_project').on(table.projectId),
  idxTutorialProjectSubmissionsStatus: index('idx_tutorial_project_submissions_status').on(table.status),
}));
