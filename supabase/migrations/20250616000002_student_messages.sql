-- Per-student messaging thread (admin, student, linked parents)

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_student_created
  ON public.messages(student_id, created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages readable by authorized users"
  ON public.messages FOR SELECT
  USING (private.can_access_student(student_id));

CREATE POLICY "Authorized users send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND private.can_access_student(student_id)
  );
