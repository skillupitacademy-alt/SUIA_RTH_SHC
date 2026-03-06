
import { container } from '@/modules/core/container';

import { AdminAnalyticsEngine as _AdminAnalyticsEngine } from './admin.analytics.engine';
import { AdminBlueprintEngine as _AdminBlueprintEngine } from './admin.blueprint.engine';
import { AdminDomainEngine as _AdminDomainEngine } from './admin.domain.engine';
import { AdminQuestionEngine as _AdminQuestionEngine } from './admin.question.engine';
import { AdminSkillEngine as _AdminSkillEngine } from './admin.skill.engine';
import { AdminSubjectEngine as _AdminSubjectEngine } from './admin.subject.engine';
import { AdminSubtopicEngine as _AdminSubtopicEngine } from './admin.subtopic.engine';
import { AdminTopicEngine as _AdminTopicEngine } from './admin.topic.engine';
import { AdminUserEngine as _AdminUserEngine } from './admin.user.engine';

export const AdminAnalyticsEngine = container.get(_AdminAnalyticsEngine);
export const AdminBlueprintEngine = container.get(_AdminBlueprintEngine);
export const AdminDomainEngine = container.get(_AdminDomainEngine);
export const AdminQuestionEngine = container.get(_AdminQuestionEngine);
export const AdminSkillEngine = container.get(_AdminSkillEngine);
export const AdminSubjectEngine = container.get(_AdminSubjectEngine);
export const AdminSubtopicEngine = container.get(_AdminSubtopicEngine);
export const AdminTopicEngine = container.get(_AdminTopicEngine);
export const AdminUserEngine = container.get(_AdminUserEngine);

export type { AdminAnalyticsEngine as AdminAnalyticsEngineClass } from './admin.analytics.engine';
export type { AdminBlueprintEngine as AdminBlueprintEngineClass } from './admin.blueprint.engine';
export type { AdminDomainEngine as AdminDomainEngineClass } from './admin.domain.engine';
export type { CreateQuestionInput } from './admin.question.engine';
export type { AdminQuestionEngine as AdminQuestionEngineClass } from './admin.question.engine';
export type { AdminSkillEngine as AdminSkillEngineClass } from './admin.skill.engine';
export type { AdminSubjectEngine as AdminSubjectEngineClass } from './admin.subject.engine';
export type { AdminSubtopicEngine as AdminSubtopicEngineClass } from './admin.subtopic.engine';
export type { AdminTopicEngine as AdminTopicEngineClass } from './admin.topic.engine';
export type { UpdateUserInput } from './admin.user.engine';
export type { AdminUserEngine as AdminUserEngineClass } from './admin.user.engine';

