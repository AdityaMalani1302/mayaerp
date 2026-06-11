-- Run this in the Supabase SQL Editor (Dashboard SQL Editor New Query)
-- Creates the table used by MayaSoft ERP to store all application data.

CREATE TABLE IF NOT EXISTS erp_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE erp_data ENABLE ROW LEVEL SECURITY;

-- Allow anonymous reads but restrict writes with application-level validation
CREATE POLICY "Allow anonymous reads" ON erp_data
  FOR SELECT
  USING (true);

-- For production, replace the above with user-specific policies tied to Supabase Auth.
-- Example (uncomment and customize):
-- CREATE POLICY "User can read own data" ON erp_data
--   FOR SELECT
--   USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "User can insert own data" ON erp_data
--   FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
--
-- CREATE POLICY "User can update own data" ON erp_data
--   FOR UPDATE
--   USING (auth.role() = 'authenticated')
--   WITH CHECK (auth.role() = 'authenticated');

-- Create index for faster lookups by key prefix
CREATE INDEX IF NOT EXISTS idx_erp_data_key ON erp_data (key);
