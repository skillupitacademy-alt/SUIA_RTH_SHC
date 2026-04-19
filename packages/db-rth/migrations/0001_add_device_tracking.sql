-- Migration: Add device tracking fields to refresh_tokens table (RealTutorialHub)
-- Date: 2026-04-19
-- Purpose: Enable device session management for FAANG-level security features

-- Add device tracking columns
ALTER TABLE refresh_tokens 
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS device_name TEXT,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP DEFAULT NOW();

-- Create indexes for faster device queries
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_device_id 
  ON refresh_tokens(device_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_device 
  ON refresh_tokens(user_id, device_id);

-- Add comment for documentation
COMMENT ON COLUMN refresh_tokens.device_id IS 'Unique device identifier for tracking user sessions across devices';
COMMENT ON COLUMN refresh_tokens.ip_address IS 'IP address from which the session was created';
COMMENT ON COLUMN refresh_tokens.user_agent IS 'Browser/device user agent string';
COMMENT ON COLUMN refresh_tokens.device_name IS 'Human-readable device name (e.g., Chrome on Windows)';
COMMENT ON COLUMN refresh_tokens.last_used_at IS 'Last time this refresh token was used';
