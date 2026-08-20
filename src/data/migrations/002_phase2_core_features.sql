-- Phase 2 Migration: Core Enhanced Features
-- This migration adds tables for Tasks, Deals, Companies, and Reminders.
-- Run against your Vercel Postgres database:
--   psql $POSTGRES_URL -f src/data/migrations/002_phase2_core_features.sql

-- ============================================================
-- COMPANIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  website VARCHAR(200),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(user_id, name);

-- ============================================================
-- DEALS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  value NUMERIC(12,2) DEFAULT 0,
  stage VARCHAR(20) NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead','qualified','proposal','negotiation','won','lost')),
  probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deals_user ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(user_id, stage);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(user_id, expected_close_date);

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_contact ON tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal ON tasks(deal_id);

-- ============================================================
-- REMINDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES users(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('follow_up','birthday','anniversary','custom')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  recurrence VARCHAR(10) DEFAULT 'none' CHECK (recurrence IN ('none','daily','weekly','monthly','yearly')),
  status VARCHAR(15) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','snoozed')),
  snoozed_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_contact ON reminders(contact_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders(user_id, remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(user_id, status);

-- ============================================================
-- RLS POLICIES (if using Supabase-style RLS)
-- ============================================================
-- NOTE: With Vercel Postgres, backend-level user_id filtering is the primary guard.
-- These are provided for documentation / if using a compatible platform.

-- companies
-- CREATE POLICY "Users can CRUD their own companies" ON companies
--   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- deals
-- CREATE POLICY "Users can CRUD their own deals" ON deals
--   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- tasks
-- CREATE POLICY "Users can CRUD their own tasks" ON tasks
--   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);

-- reminders
-- CREATE POLICY "Users can CRUD their own reminders" ON reminders
--   FOR ALL USING (user_id = current_setting('app.current_user_id')::uuid);
