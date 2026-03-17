-- Migration: Add screenshot support and update comments schema
-- Created: 2026-01-13

-- Drop old comments table and recreate with new schema
DROP TABLE IF EXISTS comments;

-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
  id TEXT PRIMARY KEY,
  page_url TEXT NOT NULL,
  page_title TEXT,
  image_data TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create new comments table with region support
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  screenshot_id TEXT NOT NULL,
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL NOT NULL,
  height REAL NOT NULL,
  commenter_name TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (screenshot_id) REFERENCES screenshots(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_screenshots_url ON screenshots(page_url);
CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);
CREATE INDEX IF NOT EXISTS idx_comments_screenshot ON comments(screenshot_id);
CREATE INDEX IF NOT EXISTS idx_comments_timestamp ON comments(timestamp);
