-- Fix infinite recursion in tutor_comments INSERT policies.
-- Subqueries against tutor_comments inside RLS policies re-trigger SELECT policies;
-- use SECURITY DEFINER helpers so parent-comment checks bypass RLS.

CREATE OR REPLACE FUNCTION private.student_can_reply_to_comment(
  p_parent_comment_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutor_comments parent
    WHERE parent.id = p_parent_comment_id
      AND parent.student_id = p_student_id
      AND parent.visible_to_student = true
  );
$$;

CREATE OR REPLACE FUNCTION private.parent_can_reply_to_comment(
  p_parent_comment_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tutor_comments parent
    WHERE parent.id = p_parent_comment_id
      AND parent.student_id = p_student_id
      AND parent.visible_to_parent = true
  );
$$;

REVOKE ALL ON FUNCTION private.student_can_reply_to_comment(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.parent_can_reply_to_comment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.student_can_reply_to_comment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.parent_can_reply_to_comment(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Students create comment replies" ON public.tutor_comments;
DROP POLICY IF EXISTS "Parents create comment replies" ON public.tutor_comments;

CREATE POLICY "Students create comment replies"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (
    parent_comment_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = student_id AND s.profile_id = auth.uid()
    )
    AND private.student_can_reply_to_comment(parent_comment_id, student_id)
  );

CREATE POLICY "Parents create comment replies"
  ON public.tutor_comments FOR INSERT
  WITH CHECK (
    parent_comment_id IS NOT NULL
    AND private.is_parent_of_student(student_id)
    AND private.parent_can_reply_to_comment(parent_comment_id, student_id)
  );
