-- Each student starts with 10 streak freezes to spend on excused days.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS streak_freeze_balance integer NOT NULL DEFAULT 10;

UPDATE public.students
SET streak_freeze_balance = 10;
