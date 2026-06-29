-- Parents can start homework comment threads on any linked assignment
-- (not only after the student submits), so they can discuss the work with their child.

DROP POLICY IF EXISTS "Parents create homework comments" ON public.tutor_comments;

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
    )
  );
