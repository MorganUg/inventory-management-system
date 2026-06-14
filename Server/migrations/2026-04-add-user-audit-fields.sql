-- Migration: Add audit fields to users table
-- Run this in your database before using the new Logs + Force Password features

ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- Optional: Set existing users to not require password change
UPDATE users SET force_password_change = FALSE WHERE force_password_change IS NULL;

-- Index for faster queries on last login (useful for logs)
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the user''s most recent successful login';
COMMENT ON COLUMN users.force_password_change IS 'If true, user must change their password on next login (set by admin on create or reset)';