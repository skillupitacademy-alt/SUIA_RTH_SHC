/**
 * Feature Flags Database Schema
 */

import { pgTable, text, uuid, timestamp, boolean, unique } from 'drizzle-orm/pg-core';

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  brand: text('brand').notNull(), // 'realtutorialhub' | 'skillup'
  feature_key: text('feature_key').notNull(),
  enabled: boolean('enabled').notNull().default(false),
  description: text('description'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow()
}, (table) => ({
  // Ensure unique combination of brand + feature_key
  brandFeatureUnique: unique().on(table.brand, table.feature_key)
}));

// SQL for creating the table
export const createFeatureFlagsTable = `
  CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    feature_key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Ensure unique combination of brand + feature
    UNIQUE(brand, feature_key)
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_feature_flags_brand ON feature_flags(brand);
  CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
  CREATE INDEX IF NOT EXISTS idx_feature_flags_brand_enabled ON feature_flags(brand, enabled);

  -- Add check constraints
  ALTER TABLE feature_flags ADD CONSTRAINT IF NOT EXISTS feature_flags_brand_check 
    CHECK (brand IN ('realtutorialhub', 'skillup'));

  -- Add trigger to update updated_at
  CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_update_feature_flags_updated_at ON feature_flags;
  CREATE TRIGGER trigger_update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_feature_flags_updated_at();
`;

// Insert default feature flags
export const insertDefaultFeatureFlags = `
  -- Insert default feature flags for RTH
  INSERT INTO feature_flags (brand, feature_key, enabled, description) VALUES
    ('realtutorialhub', 'AI_LABS', true, 'AI-powered learning labs'),
    ('realtutorialhub', 'ADVANCED_ANALYTICS', true, 'Advanced learning analytics'),
    ('realtutorialhub', 'LIVE_SESSIONS', true, 'Live tutoring sessions'),
    ('realtutorialhub', 'PROJECT_REVIEWS', true, 'Project review system'),
    ('realtutorialhub', 'CERTIFICATES', true, 'Certificate generation'),
    ('realtutorialhub', 'API_ACCESS', true, 'API access for integrations'),
    ('realtutorialhub', 'CUSTOM_BRANDING', false, 'Custom branding options')
  ON CONFLICT (brand, feature_key) DO NOTHING;

  -- Insert default feature flags for SkillUp
  INSERT INTO feature_flags (brand, feature_key, enabled, description) VALUES
    ('skillup', 'PLACEMENT', true, 'Job placement assistance'),
    ('skillup', 'LIVE_SESSIONS', true, 'Live training sessions'),
    ('skillup', 'CERTIFICATES', true, 'Industry certificates'),
    ('skillup', 'MOBILE_APP', true, 'Mobile application access'),
    ('skillup', 'BULK_IMPORT', true, 'Bulk student import'),
    ('skillup', 'CUSTOM_BRANDING', true, 'Custom branding options')
  ON CONFLICT (brand, feature_key) DO NOTHING;
`;