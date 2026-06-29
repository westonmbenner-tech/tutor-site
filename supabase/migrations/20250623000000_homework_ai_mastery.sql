-- Optional AI mastery chat before students can submit homework.

ALTER TABLE public.homework_assignments
  ADD COLUMN IF NOT EXISTS mandate_ai_mastery boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mastery_source_type text
    CHECK (mastery_source_type IS NULL OR mastery_source_type IN ('text', 'url')),
  ADD COLUMN IF NOT EXISTS mastery_source_text text,
  ADD COLUMN IF NOT EXISTS mastery_source_url text,
  ADD COLUMN IF NOT EXISTS mastery_session jsonb;
