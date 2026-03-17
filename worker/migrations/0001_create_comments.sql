-- Migration: Create comments table
-- Created: 2026-01-13

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  target_url TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  commenter_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_target_url ON comments(target_url);
CREATE INDEX IF NOT EXISTS idx_timestamp ON comments(timestamp);
CREATE INDEX IF NOT EXISTS idx_resolved ON comments(resolved);
