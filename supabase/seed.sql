-- Seed data for local testing
-- NOTE: Replace UUIDs with actual auth.users IDs after users sign up via Google OAuth.
-- This seed assumes you will run the profile/student inserts manually after first login.
-- See README.md for full setup instructions.

-- Example: after creating test users in Supabase Auth, uncomment and adjust:

/*
-- Admin profile (replace with real auth user id)
UPDATE public.profiles SET role = 'admin', full_name = 'Tutor Admin'
WHERE email = 'tutor@example.com';

-- Student profile
UPDATE public.profiles SET role = 'student', full_name = 'Alex Student'
WHERE email = 'student@example.com';

INSERT INTO public.students (id, profile_id, display_name, active)
SELECT gen_random_uuid(), id, 'Alex Student', true
FROM public.profiles WHERE email = 'student@example.com';

-- Parent profile
UPDATE public.profiles SET role = 'parent', full_name = 'Sam Parent'
WHERE email = 'parent@example.com';

INSERT INTO public.parents (id, profile_id, display_name)
SELECT gen_random_uuid(), id, 'Sam Parent'
FROM public.profiles WHERE email = 'parent@example.com';

-- Link parent to student
INSERT INTO public.parent_student_links (parent_id, student_id)
SELECT p.id, s.id
FROM public.parents p
CROSS JOIN public.students s
WHERE p.display_name = 'Sam Parent' AND s.display_name = 'Alex Student';
*/

-- Sample homework / logs can be added via the admin UI once users exist.
