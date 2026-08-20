-- Migration: Add users table and user_id to contacts
-- Run this once against your Vercel Postgres database

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add user_id column to vercel_contacts (nullable initially for migration)
ALTER TABLE vercel_contacts ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);

-- 3. Create index on user_id for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_vercel_contacts_user_id ON vercel_contacts(user_id);

-- 4. Optional: RLS policies (requires Postgres 14+ with pgcrypto or similar for auth.uid())
-- Note: With Vercel Postgres connection pooling, RLS requires setting a local variable
-- per query. We implement backend-level user_id filtering as the primary guard.
-- Uncomment below if you want DB-level enforcement:
-- ALTER TABLE vercel_contacts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_isolation ON vercel_contacts FOR ALL USING (user_id = current_setting('app.current_user_id', true));
