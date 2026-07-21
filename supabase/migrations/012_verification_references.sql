-- Diploma Tracking System - Verification References
-- Epic: DTS-58 (Public Diploma Verification Portal)
-- Story: DTS-61

CREATE TABLE IF NOT EXISTS verification_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    reference_code TEXT UNIQUE NOT NULL,
    code_hash TEXT NOT NULL,
    verification_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    verified_count INTEGER NOT NULL DEFAULT 0,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES students(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_vref_code ON verification_references(reference_code);
CREATE INDEX IF NOT EXISTS idx_vref_enrollment ON verification_references(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_vref_active ON verification_references(is_active) WHERE is_active = true;

ALTER TABLE verification_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_active" ON verification_references
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "admin_all" ON verification_references
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = auth.uid()
            AND students.role IN ('admin', 'sysadmin')
        )
    );

CREATE POLICY "coordinator_select" ON verification_references
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM students
            WHERE students.id = auth.uid()
            AND students.role IN ('coordinador', 'admin', 'sysadmin')
        )
    );
