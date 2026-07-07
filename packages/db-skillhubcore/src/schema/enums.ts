import { pgEnum } from 'drizzle-orm/pg-core';

// Status enum for all entities
export const statusEnum = pgEnum('entity_status', [
  'draft',
  'active',
  'archived',
  'deleted',
]);

// Domain categories
export const domainCategoryEnum = pgEnum('domain_category', [
  'academic',
  'professional',
  'technical',
  'creative',
  'life_skills',
]);

// Topic complexity levels
export const topicComplexityEnum = pgEnum('topic_complexity', [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

// Skill categories
export const skillCategoryEnum = pgEnum('skill_category', [
  'technical',
  'soft',
  'analytical',
  'creative',
  'managerial',
  'communication',
]);