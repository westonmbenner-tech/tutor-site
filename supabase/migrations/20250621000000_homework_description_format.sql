-- How homework descriptions render for students and parents.
ALTER TABLE public.homework_assignments
  ADD COLUMN IF NOT EXISTS description_format text NOT NULL DEFAULT 'plain'
  CHECK (description_format IN ('plain', 'latex'));
