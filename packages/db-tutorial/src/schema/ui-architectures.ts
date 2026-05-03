/* istanbul ignore file */
/**
 * UI Architectures - Renderer Templates
 * Phase 1 P0 Foundation - Database Governance
 * Enhanced with Gap Remediation (GAP 4)
 * 
 * Defines how sections are rendered in the UI
 * Examples: Card Layout, List Layout, Immersive Layout, Accessibility Optimized
 */

import { boolean, integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { brandEnum, brandVisibilityEnum } from './enums-modular';

/**
 * UI Architectures Table
 * Templates for section rendering and layout
 */
export const uiArchitectures = pgTable('ui_architectures', {
  // Primary Key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Architecture Metadata
  name: text('name').notNull().unique(),
  description: text('description'),
  
  // Renderer Configuration
  sectionRenderers: jsonb('section_renderers').$type<{
    sectionType: string;
    componentName: string;
    layoutConfig: {
      spacing: string;
      maxWidth: string;
      imagePosition: 'right' | 'bottom' | 'inline';
      codeTheme: string;
      cardStyle: 'elevated' | 'flat' | 'outlined';
    };
  }[]>().notNull(),
  
  // Responsive Configuration
  responsiveBreakpoints: jsonb('responsive_breakpoints').$type<{
    mobile: string;
    tablet: string;
    desktop: string;
  }>(),
  
  // Accessibility Configuration
  accessibilityProfile: text('accessibility_profile').notNull().default('standard'), // standard, high_contrast, screen_reader_optimized
  
  // GAP 4: Brand Partitioning
  brandId: brandEnum('brand_id').notNull().default('shared'),
  brandVisibility: brandVisibilityEnum('brand_visibility').notNull().default('shared_visible'),
  brandCompatibility: jsonb('brand_compatibility').$type<{
    brandId: string;
    isCompatible: boolean;
    customRenderers?: any[];
    customBreakpoints?: any;
    customTheme?: any;
  }[]>(),
  
  // Status & Usage
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').notNull().default(0),
  
  // Timestamps
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  // Indexes
  idxUIBrand: index('idx_ui_brand').on(table.brandId),
  idxUIActive: index('idx_ui_active').on(table.isActive),
}));

/**
 * Type inference for TypeScript
 */
export type UIArchitecture = typeof uiArchitectures.$inferSelect;
export type NewUIArchitecture = typeof uiArchitectures.$inferInsert;
