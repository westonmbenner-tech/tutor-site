-- Threaded tutor comments: students and parents can reply to comments they can read.

ALTER TABLE public.tutor_comments
  ADD COLUMN IF NOT EXISTS parent_comment_id uuid
    REFERENCES public.tutor_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_tutor_comments_parent
  ON public.tutor_comments(parent_comment_id);

DROP POLICY IF EXISTS "Comments readable by role visibility" ON public.tutor_comments;
DROP POLICY IF EXISTS "Admin creates comments" ON public.tutor_comments;

CREATE POLICY "Comments readable by role visibility"
  ON public.tutor_comments FOR SELECT
  USING (
    private.is_admin()
    OR author_id = auth.uid()
    OR (
      visible_to_student = true
      AND EXISTS (
        SELECT 1 FROM public.students s
        WHERE s.id = student_id AND s.profile_id = auth.uid()
      )
    )
    OR (
      visible_to_parent = true
      AND private.is_parent_of_student(student_id)
    )
  );

CREATE POLICY "Admin creates comments"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (private.is_admin());

CREATE POLICY "Students create comment replies"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (
    parent_comment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.tutor_comments parent
      WHERE parent.id = parent_comment_id
        AND parent.student_id = tutor_comments.student_id
        AND parent.visible_to_student = true
    )
  );

CREATE POLICY "Parents create comment replies"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (
    parent_comment_id IS NOT NULL
    AND private.is_parent_of_student(student_id)
    AND EXISTS (
      SELECT 1 FROM public.tutor_comments parent
      WHERE parent.id = parent_comment_id
        AND parent.student_id = tutor_comments.student_id
        AND parent.visible_to_parent = true
    )
  );
