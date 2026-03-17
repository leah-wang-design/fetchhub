-- Migration: Add workspaces support
-- Created: 2026-01-18

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Add workspace_id column to screenshots table
ALTER TABLE screenshots ADD COLUMN workspace_id TEXT DEFAULT 'default';

-- Create index for workspace filtering
CREATE INDEX IF NOT EXISTS idx_screenshots_workspace ON screenshots(workspace_id);

-- Create default workspace
INSERT INTO workspaces (id, name, created_by, created_at, updated_at)
VALUES ('default', 'Default Workspace', 'system', unixepoch(), unixepoch());

-- Update existing screenshots to use default workspace
UPDATE screenshots SET workspace_id = 'default' WHERE workspace_id IS NULL OR workspace_id = '';
