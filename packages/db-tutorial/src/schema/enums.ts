import { pgEnum } from 'drizzle-orm/pg-core';

export const tutorialDifficultyEnum = pgEnum('tutorial_difficulty', ['simple', 'mixed', 'intermediate', 'expert']);
export const tutorialQuestionTypeEnum = pgEnum('tutorial_question_type', ['mcq', 'short_answer', 'code', 'drag_drop', 'fill_blank']);
export const tutorialProjectScopeEnum = pgEnum('tutorial_project_scope', ['topic', 'subject', 'domain']);
export const tutorialProjectLevelEnum = pgEnum('tutorial_project_level', ['simple', 'intermediate', 'expert']);
export const tutorialProjectSubmissionStatusEnum = pgEnum('tutorial_project_submission_status', [
  'pending',
  'submitted',
  'graded',
  'revision-requested',
]);
export const tutorialDeliverableTypeEnum = pgEnum('tutorial_deliverable_type', ['code', 'repo', 'live_demo', 'document']);
export const tutorialEvaluationTypeEnum = pgEnum('tutorial_evaluation_type', ['auto', 'ai_review', 'peer_review', 'admin_review']);
export const tutorialVideoProviderEnum = pgEnum('tutorial_video_provider', ['youtube', 'vimeo', 'custom', 'loom']);
export const tutorialContentJobStatusEnum = pgEnum('tutorial_content_job_status', ['pending', 'processing', 'completed', 'failed']);
export const tutorialProgressStatusEnum = pgEnum('tutorial_progress_status', ['not_started', 'in_progress', 'completed']);
export const tutorialTriggerStatusEnum = pgEnum('tutorial_trigger_status', ['pending', 'accepted', 'dismissed', 'completed']);
