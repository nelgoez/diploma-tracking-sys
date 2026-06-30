-- Add is_demo flag to students table
-- Enables per-user mock routing: demo users get mock providers,
-- real users get live Moodle/Guarani. No global MOCK_MODE needed.

ALTER TABLE students ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_students_is_demo ON students(is_demo);

COMMENT ON COLUMN students.is_demo IS 'Demo account for public/social-media disclosure. Uses mock providers instead of live LMS.';
