-- Student homework submission text + tutor feedback linked to assignments

ALTER TABLE public.homework_assignments
  ADD COLUMN IF NOT EXISTS submission_text text;

ALTER TABLE public.tutor_comments
  ADD COLUMN IF NOT EXISTS homework_assignment_id uuid
    REFERENCES public.homework_assignments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tutor_comments_homework
  ON public.tutor_comments(homework_assignment_id);
