-- Store recent login timestamps per profile (newest first, capped at 50).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS login_history jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.record_user_login()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous timestamptz;
  v_history jsonb;
  v_now timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT login_history
  INTO v_history
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_history IS NULL OR jsonb_typeof(v_history) <> 'array' THEN
    v_history := '[]'::jsonb;
  END IF;

  IF jsonb_array_length(v_history) > 0 THEN
    BEGIN
      v_previous := (v_history->>0)::timestamptz;
    EXCEPTION
      WHEN OTHERS THEN
        v_previous := NULL;
    END;
  END IF;

  v_history := jsonb_build_array(to_jsonb(v_now::text)) || v_history;

  IF jsonb_array_length(v_history) > 50 THEN
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    INTO v_history
    FROM (
      SELECT elem
      FROM jsonb_array_elements(v_history) WITH ORDINALITY AS t(elem, ord)
      WHERE ord <= 50
    ) capped;
  END IF;

  UPDATE public.profiles
  SET login_history = v_history
  WHERE id = auth.uid();

  RETURN v_previous;
END;
$$;

REVOKE ALL ON FUNCTION public.record_user_login() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_user_login() TO authenticated;
