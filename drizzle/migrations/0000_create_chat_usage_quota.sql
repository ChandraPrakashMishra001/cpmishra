CREATE TABLE public.chat_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_key text NOT NULL,
  usage_day date NOT NULL DEFAULT (current_date),
  used_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usage_key, usage_day)
);

CREATE INDEX idx_chat_usage_day ON public.chat_usage (usage_day);

GRANT ALL ON public.chat_usage TO service_role;

ALTER TABLE public.chat_usage ENABLE ROW LEVEL SECURITY;
-- No policies: table is locked for anon/authenticated. Only service_role (edge functions) touches it.

CREATE OR REPLACE FUNCTION public.get_chat_quota(p_key text, p_day date, p_limit integer)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (SELECT used_count FROM public.chat_usage WHERE usage_key = p_key AND usage_day = p_day),
    0
  )
$$;

CREATE OR REPLACE FUNCTION public.consume_chat_quota(p_key text, p_day date, p_limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
BEGIN
  INSERT INTO public.chat_usage (usage_key, usage_day, used_count)
  VALUES (p_key, p_day, 1)
  ON CONFLICT (usage_key, usage_day)
  DO UPDATE SET used_count = public.chat_usage.used_count + 1, last_used_at = now()
  RETURNING used_count INTO used;

  IF used > p_limit THEN
    RETURN -1;
  END IF;
  RETURN p_limit - used;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_chat_quota(text, date, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_chat_quota(text, date, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_quota(text, date, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_chat_quota(text, date, integer) TO service_role;
COMMENT ON TABLE public.chat_usage IS 'Per-visitor daily fair-use counters for the Amanai chat (device-id or IP keyed, one row per UTC day).';