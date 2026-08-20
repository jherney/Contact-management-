-- PostgreSQL initialization script for Contact Management System
-- This runs automatically on first startup of a fresh PostgreSQL container

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table (stored as JSONB for flexibility)
CREATE TABLE IF NOT EXISTS vercel_contacts (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(200) NOT NULL,
  industry VARCHAR(100),
  size VARCHAR(50),
  website VARCHAR(200),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  value NUMERIC(12,2),
  stage VARCHAR(20),
  probability INTEGER,
  expected_close_date DATE,
  notes TEXT,
  contact_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255),
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20),
  priority VARCHAR(10),
  contact_id VARCHAR(255),
  deal_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reminders table
CREATE TABLE IF NOT EXISTS reminders (
  id VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL,
  contact_id VARCHAR(255),
  deal_id VARCHAR(255),
  type VARCHAR(20),
  title VARCHAR(255),
  message TEXT,
  remind_at TIMESTAMP WITH TIME ZONE,
  recurrence VARCHAR(10),
  status VARCHAR(15),
  snoozed_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vercel_contacts_data_gin ON vercel_contacts USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies (user_id);
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals (user_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at ON reminders (remind_at);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders (status);
