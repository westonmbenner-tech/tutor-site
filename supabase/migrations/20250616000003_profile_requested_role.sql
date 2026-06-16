-- User-selected account type before tutor approval

ALTER TABLE public.profiles
ADD COLUMN requested_role text CHECK (requested_role IN ('student', 'parent'));
