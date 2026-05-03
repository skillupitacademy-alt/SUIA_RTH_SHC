/* istanbul ignore file */
/**
 * Educational Architectures - Learning Style Templates
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 4)
 * 
 * Defines how sections are composed for different learning styles
 * Examples: Beginner Friendly, Advanced Deep Dive, Visual Learner, Job Seeker
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { brandEnum, brandVisibilityEnum } from './enums-modular';

/**
 * Educational Architectures Table
 * Templates for section composition based on learning objectives
 */
export const educationalArchitectures = pgTable('educational_architectures', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Architecture Metadata
  name: text('name').notNull().unique(),
  description: text('description'),
  
  // Target Configuration
  targetAudience: jsonb('target_audience').$type<string[]>().notNull(),
  targetDomains: jsonb('target_domains').$type<string[]>(),
  
  // Section Composition
  sectionSequence: jsonb('section_sequence').$type<{
    sectionType: string;
    isRequired: boolean;
    order: number;
    subsectionDepth: 'shallow' | 'medium' | 'deep';
    estimatedTime: number;
  }[]>().notNull(),
  
  // Learning Style Configuration
  interactivityLevel: text('interactivity_level').notNull().default('medium'), // low, medium, high
  visualDensity: text('visual_density').notNull().default('medium'), // low, medium, high
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  brandOverrides: jsonb('brand_overrides').$type<{
    brandId: string;
    customName?: string;
    customDescription?: string;
    sectionSequenceOverride?: any[];
    interactivityOverride?: string;
    visualDensityOverride?: string;
  }[]>(),
  
  // Status & Usage
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes
  idxEducationalBrand: index('idx_educational_brand').on(table.brandId),
  idxEducationalActive: index('idx_educational_active').on(table.isActive),
}));

/**
 * Type inference for TypeScript
 */
export type EducationalArchitecture = typeof educationalArchitectures.$inferSelect;
export type NewEducationalArchitecture = typeof educationalArchitectures.$inferInsert;
