-- Migration 006: Make enrollments.course_id nullable
-- Reason: Track-level enrollments (batch CSV, diploma enrollment) have no course_id.
-- Course-level enrollments (individual course enrollment) have a course_id.
-- Research: .context/research/course_id-nullable-fk.md (agentic-diplo-track-sys)
-- Date: 2026-06-01

BEGIN;

-- 1. Drop NOT NULL constraint on course_id
ALTER TABLE enrollments ALTER COLUMN course_id DROP NOT NULL;

-- 2. Drop the old UNIQUE(student_id, course_id) constraint
ALTER TABLE enrollments DROP CONSTRAINT IF EXISTS enrollments_student_id_course_id_key;

-- 3. Partial unique index for course-level enrollments (both non-null)
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_student_course_unique
  ON enrollments(student_id, course_id)
  WHERE course_id IS NOT NULL;

-- 4. Partial unique index for track-level enrollments (course_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_student_track_unique
  ON enrollments(student_id, track_id)
  WHERE course_id IS NULL;

COMMIT;
