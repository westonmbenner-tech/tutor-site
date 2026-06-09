-- Tutor accountability portal — initial schema + RLS
-- Run via Supabase CLI: supabase db reset (local) or apply in SQL editor (remote)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Private schema for security definer helpers (not exposed via Data API)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;

CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.get_student_id_for_profile()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION private.is_parent_of_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_student_links psl
    JOIN public.parents p ON p.id = psl.parent_id
    WHERE p.profile_id = auth.uid() AND psl.student_id = p_student_id
  );
$$;

CREATE OR REPLACE FUNCTION private.can_access_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    private.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = p_student_id AND s.profile_id = auth.uid()
    )
    OR private.is_parent_of_student(p_student_id);
$$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'student', 'parent')) DEFAULT 'student',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  display_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.parent_student_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, student_id)
);

CREATE TABLE public.homework_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL CHECK (status IN ('assigned', 'completed', 'late', 'missing')) DEFAULT 'assigned',
  links jsonb NOT NULL DEFAULT '[]'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.study_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  questions_completed integer NOT NULL DEFAULT 0,
  questions_correct integer NOT NULL DEFAULT 0,
  questions_wrong integer NOT NULL DEFAULT 0,
  topic text,
  confidence integer CHECK (confidence BETWEEN 1 AND 5),
  errors_lessons_learned text,
  miscellaneous_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, log_date)
);

CREATE TABLE public.mistake_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, name)
);

CREATE TABLE public.mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  study_log_id uuid REFERENCES public.study_logs(id) ON DELETE SET NULL,
  mistake_date date NOT NULL,
  question_prompt text,
  topic text,
  mistake_label_id uuid REFERENCES public.mistake_labels(id) ON DELETE SET NULL,
  explanation text,
  lesson_learned text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tutor_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  study_log_id uuid REFERENCES public.study_logs(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  comment text NOT NULL,
  visible_to_student boolean NOT NULL DEFAULT true,
  visible_to_parent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_mistake_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  generated_for_start_date date NOT NULL,
  generated_for_end_date date NOT NULL,
  summary text,
  weak_areas jsonb NOT NULL DEFAULT '[]'::jsonb,
  grouped_categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_next_steps text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  freeze_date date NOT NULL,
  reason text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, freeze_date)
);

-- Indexes
CREATE INDEX idx_students_profile_id ON public.students(profile_id);
CREATE INDEX idx_parents_profile_id ON public.parents(profile_id);
CREATE INDEX idx_parent_student_links_parent ON public.parent_student_links(parent_id);
CREATE INDEX idx_parent_student_links_student ON public.parent_student_links(student_id);
CREATE INDEX idx_homework_student ON public.homework_assignments(student_id);
CREATE INDEX idx_study_logs_student_date ON public.study_logs(student_id, log_date DESC);
CREATE INDEX idx_mistakes_student_date ON public.mistakes(student_id, mistake_date DESC);
CREATE INDEX idx_tutor_comments_student ON public.tutor_comments(student_id);
CREATE INDEX idx_streak_freezes_student ON public.streak_freezes(student_id, freeze_date);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    'student'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger for study_logs and mistakes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER study_logs_updated_at
  BEFORE UPDATE ON public.study_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER mistakes_updated_at
  BEFORE UPDATE ON public.mistakes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mistake_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_freezes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR private.is_admin());

CREATE POLICY "Users can update own profile name"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR private.is_admin())
  WITH CHECK (auth.uid() = id OR private.is_admin());

CREATE POLICY "Admin can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (private.is_admin() OR auth.uid() = id);

-- Students policies
CREATE POLICY "Students readable by authorized users"
  ON public.students FOR SELECT
  USING (private.can_access_student(id));

CREATE POLICY "Admin manages students"
  ON public.students FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Parents policies
CREATE POLICY "Parents readable by self or admin"
  ON public.parents FOR SELECT
  USING (profile_id = auth.uid() OR private.is_admin());

CREATE POLICY "Admin manages parents"
  ON public.parents FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Parent-student links
CREATE POLICY "Links readable by involved parties"
  ON public.parent_student_links FOR SELECT
  USING (
    private.is_admin()
    OR private.is_parent_of_student(student_id)
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "Admin manages parent links"
  ON public.parent_student_links FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Homework
CREATE POLICY "Homework readable by authorized users"
  ON public.homework_assignments FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Admin manages homework"
  ON public.homework_assignments FOR INSERT
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin updates homework"
  ON public.homework_assignments FOR UPDATE
  USING (private.is_admin() OR (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  ))
  WITH CHECK (private.is_admin() OR (
    EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  ));

CREATE POLICY "Admin deletes homework"
  ON public.homework_assignments FOR DELETE
  USING (private.is_admin());

-- Study logs
CREATE POLICY "Study logs readable by authorized users"
  ON public.study_logs FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Students insert own study logs"
  ON public.study_logs FOR INSERT
  WITH CHECK (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "Students update own study logs"
  ON public.study_logs FOR UPDATE
  USING (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  )
  WITH CHECK (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "Admin deletes study logs"
  ON public.study_logs FOR DELETE
  USING (private.is_admin());

-- Mistake labels
CREATE POLICY "Mistake labels readable by authorized users"
  ON public.mistake_labels FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Students manage own mistake labels"
  ON public.mistake_labels FOR INSERT
  WITH CHECK (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "Admin deletes mistake labels"
  ON public.mistake_labels FOR DELETE
  USING (private.is_admin());

-- Mistakes
CREATE POLICY "Mistakes readable by authorized users"
  ON public.mistakes FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Students manage own mistakes"
  ON public.mistakes FOR INSERT
  WITH CHECK (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "Students update own mistakes"
  ON public.mistakes FOR UPDATE
  USING (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  )
  WITH CHECK (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

CREATE POLICY "Students delete own mistakes"
  ON public.mistakes FOR DELETE
  USING (
    private.is_admin()
    OR EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
  );

-- Tutor comments
CREATE POLICY "Comments readable by role visibility"
  ON public.tutor_comments FOR SELECT
  USING (
    private.is_admin()
    OR (
      visible_to_student = true
      AND EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.profile_id = auth.uid())
    )
    OR (
      visible_to_parent = true
      AND private.is_parent_of_student(student_id)
    )
  );

CREATE POLICY "Admin creates comments"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin updates comments"
  ON public.tutor_comments FOR UPDATE
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admin deletes comments"
  ON public.tutor_comments FOR DELETE
  USING (private.is_admin());

-- AI summaries
CREATE POLICY "AI summaries readable by authorized users"
  ON public.ai_mistake_summaries FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Authorized users create AI summaries"
  ON public.ai_mistake_summaries FOR INSERT
  WITH CHECK (private.can_access_student(student_id));

CREATE POLICY "Admin deletes AI summaries"
  ON public.ai_mistake_summaries FOR DELETE
  USING (private.is_admin());

-- Streak freezes
CREATE POLICY "Streak freezes readable by authorized users"
  ON public.streak_freezes FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Admin manages streak freezes"
  ON public.streak_freezes FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
