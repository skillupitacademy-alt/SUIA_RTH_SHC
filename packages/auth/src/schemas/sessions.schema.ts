/**
 * Sessions Database Schema
 */

import { pgTable, text, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull(),
  device: text('device').notNull(),
  ip_address: text('ip_address').notNull(),
  user_agent: text('user_agent').notNull(),
  refresh_token: text('refresh_token').notNull().unique(),
  brand: text('brand').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  expires_at: timestamp('expires_at').notNull(),
  last_activity: timestamp('last_activity').notNull().defaultNow(),
  revoked: boolean('revoked').notNull().default(false)
});

// SQL for creating the sessions table
export const createSessionsTable = `
  CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    device TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    refresh_token TEXT NOT NULL UNIQUE,
    brand TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked BOOLEAN NOT NULL DEFAULT false
  );

  -- Create indexes for performance
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
  CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON sessions(revoked);
  CREATE INDEX IF NOT EXISTS idx_sessions_brand ON sessions(brand);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, revoked, expires_at);

  -- Add check constraints
  ALTER TABLE sessions ADD CONSTRAINT IF NOT EXISTS sessions_brand_check 
    CHECK (brand IN ('realtutorialhub', 'skillup'));

  -- Add trigger to update last_activity on refresh token updates
  CREATE OR REPLACE FUNCTION update_session_activity()
  RETURNS TRIGGER AS $$
  BEGIN
    IF OLD.refresh_token != NEW.refresh_token THEN
      NEW.last_activity = NOW();
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  DROP TRIGGER IF EXISTS trigger_update_session_activity ON sessions;
  CREATE TRIGGER trigger_update_session_activity
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();
`;

// Function to clean up expired sessions
export const createCleanupFunction = `
  CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
  RETURNS INTEGER AS $$
  DECLARE
    deleted_count INTEGER;
  BEGIN
    DELETE FROM sessions 
    WHERE expires_at < NOW() OR revoked = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
  END;
  $$ LANGUAGE plpgsql;

  -- Create a scheduled job to run cleanup (if using pg_cron extension)
  -- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', 'SELECT cleanup_expired_sessions();');
`;