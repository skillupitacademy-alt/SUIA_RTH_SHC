-- Migration: Enterprise Auth System Enhancements
-- Adds: Device tracking, IP binding, User-Agent tracking for session hijack detection
-- Enables: Token rotation, Global logout, Multi-device session management

-- Add device tracking columns to refresh_tokens table
ALTER TABLE "refresh_tokens" 
ADD COLUMN IF NOT EXISTS "device_id" TEXT,
ADD COLUMN IF NOT EXISTS "ip_address" TEXT,
ADD COLUMN IF NOT EXISTS "user_agent" TEXT,
ADD COLUMN IF NOT EXISTS "device_name" TEXT,
ADD COLUMN IF NOT EXISTS "last_used_at" TIMESTAMP DEFAULT NOW();

-- Create index for device_id lookups
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_device_id" ON "refresh_tokens" ("device_id");

-- Create index for userId + device_id combination (for multi-device queries)
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_device" ON "refresh_tokens" ("user_id", "device_id");

-- Create index for IP address (for hijack detection)
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_ip" ON "refresh_tokens" ("ip_address");

-- Add comment to explain the schema
COMMENT ON COLUMN "refresh_tokens"."device_id" IS 'Unique identifier for the device/browser (generated client-side)';
COMMENT ON COLUMN "refresh_tokens"."ip_address" IS 'IP address of the device when token was created';
COMMENT ON COLUMN "refresh_tokens"."user_agent" IS 'Browser/device user agent string';
COMMENT ON COLUMN "refresh_tokens"."device_name" IS 'Human-readable device name (e.g., "Chrome on Windows")';
COMMENT ON COLUMN "refresh_tokens"."last_used_at" IS 'Last time this token was used for refresh (for session activity tracking)';
