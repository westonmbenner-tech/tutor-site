-- Store multiple AI grading runs per homework assignment (supports resubmissions).

ALTER TABLE public.homework_assignments
  ADD COLUMN IF NOT EXISTS ai_gradings jsonb NOT NULL DEFAULT '[]'::jsonb;
