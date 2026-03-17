-- Migration: Add user tracking and authentication
-- Created: 2026-01-15

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id column to screenshots
ALTER TABLE screenshots ADD COLUMN user_id TEXT;

-- Add user_id column to comments  
ALTER TABLE comments ADD COLUMN user_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_screenshots_user ON screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
