/**
 * RBAC Database Schema
 * Add role column to existing users table
 */

import { pgTable, text, uuid, timestamp, boolean } from 'drizzle-orm/pg-core';

// Extend existing users table with role column
export const userRoleUpdate = `
  -- Add role column to users table if it doesn't exist
  DO $$ 
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
      ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'student';
    END IF;
  END $$;

  -- Create index on role for performance
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

  -- Add check constraint for valid roles
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.check_constraints 
      WHERE constraint_name = 'users_role_check'
    ) THEN
      ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('student', 'instructor', 'admin', 'super_admin'));
    END IF;
  END $$;
`;

// For TypeScript type safety, define the role enum
export const roleEnum = ['student', 'instructor', 'admin', 'super_admin'] as const;