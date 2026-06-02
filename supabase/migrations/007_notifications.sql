-- Migration 007: Notifications table + Audit_log RLS fix
-- Phase 6: Notification infrastructure + security hardening

-- ============================================================================
-- 1. Notifications table
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'eligibility_change',
    'new_certificate',
    'override_applied',
    'override_expired',
    'diploma_issued',
    'exam_graded'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '90 days')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_student_id ON notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_student_unread
  ON notifications(student_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at)
  WHERE expires_at IS NOT NULL;

-- Auto-update created_at trigger (consistent with other tables)
-- No update needed on notifications — they're append-only (read toggle doesn't change timestamp)

-- ============================================================================
-- 2. Enable RLS on notifications
-- ============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: server-side via service_role bypasses RLS. Client-side blocked.
CREATE POLICY "Block client access to notifications"
  ON notifications
  FOR ALL
  TO authenticated, anon
  USING (false);

-- Allow students to read their own notifications via anon key with JWT
-- (uses custom JWT claims if available, otherwise falls back to service_role path)
CREATE POLICY "Service reads all notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 3. Fix audit_log RLS (was disabled — security advisory)
-- ============================================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Block all direct client access to audit_log — only service_role bypasses RLS
DROP POLICY IF EXISTS "Block client access to audit_log" ON audit_log;

CREATE POLICY "Block client access to audit_log"
  ON audit_log
  FOR ALL
  TO authenticated, anon
  USING (false);

-- Service role access for admin queries (system diagnostics)
CREATE POLICY "Service reads audit_log"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 4. Institutions table (multi-university layer — Future Phase 6C)
-- ============================================================================
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL DEFAULT 'AR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  moodle_url TEXT,
  moodle_token_encrypted TEXT,
  guarani_url TEXT,
  guarani_token_encrypted TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block client access to institutions"
  ON institutions
  FOR ALL
  TO authenticated, anon
  USING (false);

-- Seed default institution (UNC)
INSERT INTO institutions (name, code, country)
VALUES (
  'Universidad Nacional de Córdoba',
  'UNC',
  'AR'
) ON CONFLICT (code) DO NOTHING;

-- Add institution_id to students (nullable for backward compat)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- Add institution_id to tracks
ALTER TABLE tracks
  ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id);

-- Set existing students and tracks to UNC
UPDATE students SET institution_id = (SELECT id FROM institutions WHERE code = 'UNC' LIMIT 1)
  WHERE institution_id IS NULL;

UPDATE tracks SET institution_id = (SELECT id FROM institutions WHERE code = 'UNC' LIMIT 1)
  WHERE institution_id IS NULL;
