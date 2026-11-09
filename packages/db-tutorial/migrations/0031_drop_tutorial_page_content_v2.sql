-- Migration: 0031_drop_tutorial_page_content_v2.sql
-- Purpose: Retire obsolete experimental table tutorial_page_content_v2 (0 foreign dependencies, 0 runtime consumers).
-- Guarded by accidental-data-loss-prevention: requires explicit user authorization before execution against production.

DROP TABLE IF EXISTS "public"."tutorial_page_content_v2" CASCADE;

