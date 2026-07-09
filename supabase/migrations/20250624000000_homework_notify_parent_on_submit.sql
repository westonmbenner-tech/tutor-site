-- Optional email to linked parents when a student submits homework.

ALTER TABLE public.homework_assignments
  ADD COLUMN IF NOT EXISTS notify_parent_on_submit boolean NOT NULL DEFAULT false;
