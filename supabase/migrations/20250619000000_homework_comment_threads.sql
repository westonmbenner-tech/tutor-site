-- Allow students and parents to start comment threads on submitted homework.

CREATE OR REPLACE FUNCTION private.homework_is_submitted(p_homework_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.homework_assignments h
    WHERE h.id = p_homework_id
      AND (
        h.status = 'completed'
        OR h.completed_at IS NOT NULL
        OR NULLIF(BTRIM(h.submission_text), '') IS NOT NULL
      )
  );
$$;

REVOKE ALL ON FUNCTION private.homework_is_submitted(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.homework_is_submitted(uuid) TO authenticated;

CREATE POLICY "Students create homework comments"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (
    parent_comment_id IS NULL
    AND homework_assignment_id IS NOT NULL
    AND study_log_id IS NULL
    AND author_id = auth.uid()
    AND visible_to_student = true
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.profile_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.homework_assignments h
      WHERE h.id = homework_assignment_id
        AND h.student_id = tutor_comments.student_id
        AND private.homework_is_submitted(h.id)
    )
  );

CREATE POLICY "Parents create homework comments"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (
    parent_comment_id IS NULL
    AND homework_assignment_id IS NOT NULL
    AND study_log_id IS NULL
    AND author_id = auth.uid()
    AND visible_to_parent = true
    AND private.is_parent_of_student(student_id)
    AND EXISTS (
      SELECT 1 FROM public.homework_assignments h
      WHERE h.id = homework_assignment_id
        AND h.student_id = tutor_comments.student_id
        AND private.homework_is_submitted(h.id)
    )
  );
