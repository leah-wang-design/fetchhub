-- Migration: Add trash bin support with soft deletes
-- Created: 2026-01-14

-- Add deleted_at column to screenshots table
ALTER TABLE screenshots ADD COLUMN deleted_at INTEGER DEFAULT NULL;

-- Create index for efficient trash queries
CREATE INDEX IF NOT EXISTS idx_screenshots_deleted ON screenshots(deleted_at);
