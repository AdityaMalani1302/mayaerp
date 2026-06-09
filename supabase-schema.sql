-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates the table used by MayaSoft ERP to store all application data.

CREATE TABLE IF NOT EXISTS erp_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE erp_data ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read/write access (since this uses the anon key)
-- For production, you should restrict this with proper auth policies
CREATE POLICY "Allow anonymous access" ON erp_data
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups by key prefix
CREATE INDEX IF NOT EXISTS idx_erp_data_key ON erp_data (key);
