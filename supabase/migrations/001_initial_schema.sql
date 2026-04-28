-- Diploma Tracking System - Initial Schema
-- Generated from: .context/SRS/architecture-specs.md (ERD)
-- Status: Placeholder - Run after Supabase project setup

-- ============================================
-- STUDENTS
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guarani_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    dni TEXT UNIQUE,
    role TEXT NOT NULL DEFAULT 'estudiante' CHECK (role IN ('estudiante', 'coordinador', 'admin', 'sysadmin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_guarani_id ON students(guarani_id);
CREATE INDEX idx_students_role ON students(role);

-- ============================================
-- TRACKS (Diplomaturas)
-- ============================================
CREATE TABLE IF NOT EXISTS tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    credits_required INTEGER NOT NULL DEFAULT 20,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracks_code ON tracks(code);

-- ============================================
-- COURSES
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    credits INTEGER NOT NULL DEFAULT 4,
    moodle_course_id TEXT,
    is_integrator_exam BOOLEAN NOT NULL DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(track_id, code)
);

CREATE INDEX idx_courses_track_id ON courses(track_id);
CREATE INDEX idx_courses_moodle_id ON courses(moodle_course_id);

-- ============================================
-- CERTIFICATES
-- ============================================
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    moodle_certificate_id TEXT UNIQUE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
    qualification NUMERIC(4,2),
    is_valid BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_certificates_student_id ON certificates(student_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_status ON certificates(status);

-- ============================================
-- ENROLLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    enrollment_date DATE,
    completion_date DATE,
    qualification NUMERIC(4,2),
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ============================================
-- PREREQUISITE RULES
-- ============================================
CREATE TABLE IF NOT EXISTS prerequisite_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    condition TEXT NOT NULL DEFAULT 'ALL' CHECK (condition IN ('ALL', 'ANY')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES students(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prerequisite_rules_target ON prerequisite_rules(target_course_id);

-- ============================================
-- PREREQUISITE SOURCES (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS prerequisite_sources (
    rule_id UUID NOT NULL REFERENCES prerequisite_rules(id) ON DELETE CASCADE,
    source_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (rule_id, source_course_id)
);

-- ============================================
-- MANUAL OVERRIDES
-- ============================================
CREATE TABLE IF NOT EXISTS manual_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('enable', 'disable')),
    reason TEXT NOT NULL,
    created_by UUID REFERENCES students(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_manual_overrides_student ON manual_overrides(student_id);

-- ============================================
-- INTEGRATION LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_type TEXT NOT NULL CHECK (integration_type IN ('moodle', 'guarani')),
    operation TEXT NOT NULL CHECK (operation IN ('sync', 'fetch', 'push')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('success', 'error', 'pending')),
    message TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_type ON integration_logs(integration_type);
CREATE INDEX idx_integration_logs_created ON integration_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisite_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE prerequisite_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

-- Students: Users can read their own data, admins can read all
CREATE POLICY "Users can read own profile"
    ON students FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can manage all students"
    ON students FOR ALL
    USING (EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('admin', 'sysadmin')
    ));

-- Certificates: Students can read their own, coordinators/admins can read all
CREATE POLICY "Students can read own certificates"
    ON certificates FOR SELECT
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
    ));

-- Enrollments: Similar pattern
CREATE POLICY "Students can read own enrollments"
    ON enrollments FOR SELECT
    USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
    ));

-- For MVP, allow all operations for authenticated users (refine later)
CREATE POLICY "Authenticated users can manage enrollments"
    ON enrollments FOR ALL
    USING (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tracks_updated_at
    BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER certificates_updated_at
    BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER enrollments_updated_at
    BEFORE UPDATE ON enrollments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER prerequisite_rules_updated_at
    BEFORE UPDATE ON prerequisite_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- SEED DATA (Optional - for development)
-- ============================================
-- Uncomment below to add sample data for testing

-- INSERT INTO students (id, name, email, dni, role) VALUES
--     ('00000000-0000-0000-0000-000000000001', 'Usuario Prueba', 'test@example.com', '12345678', 'estudiante');