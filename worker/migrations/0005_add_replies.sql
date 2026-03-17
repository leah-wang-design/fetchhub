-- Add replies table for single-level comment replies
CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_replies_comment ON replies(comment_id);
CREATE INDEX idx_replies_created ON replies(created_at);
