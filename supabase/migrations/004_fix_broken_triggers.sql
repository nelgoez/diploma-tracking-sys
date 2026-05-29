-- Phase B: Fix broken triggers on tables without updated_at column

-- Drop broken triggers first
DROP TRIGGER IF EXISTS prerequisite_sources_updated_at ON prerequisite_sources;
DROP TRIGGER IF EXISTS integration_logs_updated_at ON integration_logs;
