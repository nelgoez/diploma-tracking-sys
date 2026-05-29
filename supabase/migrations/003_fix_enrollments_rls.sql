-- Phase A: Fix enrollments RLS — replace permissive USING(true)
-- with role-based ownership policies

-- Drop the old permissive policy if it still exists
DROP POLICY IF EXISTS "Authenticated users can manage enrollments" ON enrollments;

-- Ensure proper policies exist (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can view own enrollments' AND tablename = 'enrollments') THEN
    CREATE POLICY "Students can view own enrollments"
      ON enrollments FOR SELECT
      USING (student_id IN (
        SELECT students.id FROM students WHERE students.email = (auth.jwt() ->> 'email')
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Students can read own enrollments' AND tablename = 'enrollments') THEN
    CREATE POLICY "Students can read own enrollments"
      ON enrollments FOR SELECT
      USING (student_id = auth.uid() OR EXISTS (
        SELECT 1 FROM students WHERE id = auth.uid() AND role IN ('coordinador', 'admin', 'sysadmin')
      ));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view all enrollments' AND tablename = 'enrollments') THEN
    CREATE POLICY "Staff can view all enrollments"
      ON enrollments FOR SELECT
      USING ((auth.jwt() ->> 'role') = ANY (ARRAY['coordinador', 'admin', 'sysadmin']));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can insert enrollments' AND tablename = 'enrollments') THEN
    CREATE POLICY "Staff can insert enrollments"
      ON enrollments FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can update enrollments' AND tablename = 'enrollments') THEN
    CREATE POLICY "Staff can update enrollments"
      ON enrollments FOR UPDATE
      USING ((auth.jwt() ->> 'role') = ANY (ARRAY['coordinador', 'admin', 'sysadmin']));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete enrollments' AND tablename = 'enrollments') THEN
    CREATE POLICY "Admins can delete enrollments"
      ON enrollments FOR DELETE
      USING ((auth.jwt() ->> 'role') = ANY (ARRAY['admin', 'sysadmin']));
  END IF;
END $$;
