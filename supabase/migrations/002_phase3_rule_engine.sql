-- Phase 3: Rule Engine — Schema Migration
-- Adds recursive tree support and restructures manual_overrides

-- ============================================
-- PREREQUISITE RULES — add tree support
-- ============================================
ALTER TABLE prerequisite_rules
  ADD COLUMN IF NOT EXISTS parent_rule_id UUID REFERENCES prerequisite_rules(id) ON DELETE SET NULL;

ALTER TABLE prerequisite_rules
  ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_prerequisite_rules_parent ON prerequisite_rules(parent_rule_id);

-- ============================================
-- MANUAL OVERRIDES — restructure for rule-based overrides
-- ============================================

-- Drop old column if exists (no data migration needed — dev schema)
ALTER TABLE manual_overrides DROP COLUMN IF EXISTS course_id;
ALTER TABLE manual_overrides DROP COLUMN IF EXISTS action;

-- Add new columns
ALTER TABLE manual_overrides
  ADD COLUMN IF NOT EXISTS rule_id UUID REFERENCES prerequisite_rules(id) ON DELETE CASCADE;

ALTER TABLE manual_overrides
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE manual_overrides
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked'));

ALTER TABLE manual_overrides
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

ALTER TABLE manual_overrides
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_manual_overrides_rule ON manual_overrides(rule_id);
CREATE INDEX IF NOT EXISTS idx_manual_overrides_status ON manual_overrides(status);

-- Partial unique: only one active override per (student, rule)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_override_per_student_rule
  ON manual_overrides(student_id, rule_id)
  WHERE status = 'active';

-- ============================================
-- MISSING TRIGGERS
-- ============================================

CREATE TRIGGER manual_overrides_updated_at
    BEFORE UPDATE ON manual_overrides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER prerequisite_sources_updated_at
    BEFORE UPDATE ON prerequisite_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER integration_logs_updated_at
    BEFORE UPDATE ON integration_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MISSING RLS POLICIES
-- ============================================

-- Tracks: authenticated users can read, admins can manage
CREATE POLICY "Authenticated users can read tracks"
    ON tracks FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage tracks"
    ON tracks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('admin', 'sysadmin')
    ));

-- Courses: authenticated users can read, admins can manage
CREATE POLICY "Authenticated users can read courses"
    ON courses FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage courses"
    ON courses FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('admin', 'sysadmin')
    ));

-- Prerequisite rules: coord+/admins manage, all auth read
CREATE POLICY "Authenticated users can read rules"
    ON prerequisite_rules FOR SELECT
    USING (true);

CREATE POLICY "Coordinators and admins can manage rules"
    ON prerequisite_rules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
    ));

-- Prerequisite sources: coord+/admins manage, all auth read
CREATE POLICY "Authenticated users can read sources"
    ON prerequisite_sources FOR SELECT
    USING (true);

CREATE POLICY "Coordinators and admins can manage sources"
    ON prerequisite_sources FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
    ));

-- Manual overrides: coord+/admins manage, students read own
CREATE POLICY "Students can read own overrides"
    ON manual_overrides FOR SELECT
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
    ));

CREATE POLICY "Coordinators and admins can manage overrides"
    ON manual_overrides FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
    ));

-- Integration logs: admins only
CREATE POLICY "Admins can read logs"
    ON integration_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('admin', 'sysadmin')
    ));

CREATE POLICY "Admins can manage logs"
    ON integration_logs FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('admin', 'sysadmin')
    ));
