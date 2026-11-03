drop function if exists public.get_chat_quota(text, date, integer);
drop function if exists public.get_chat_quota(text, text, integer);
drop function if exists public.consume_chat_quota(text, date, integer);
drop function if exists public.consume_chat_quota(text, text, integer);

create or replace function public.get_chat_quota(p_key text, p_day text, p_limit integer)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce((select used_count from public.chat_usage where usage_key = p_key and usage_day = p_day::date), 0)
$$;

create or replace function public.consume_chat_quota(p_key text, p_day text, p_limit integer)
returns integer
language plpgsql
set search_path = public
as $$
declare
  v_used integer;
begin
  insert into public.chat_usage (usage_key, usage_day, used_count, last_used_at)
  values (p_key, p_day::date, 1, now())
  on conflict (usage_key, usage_day)
  do update set used_count = public.chat_usage.used_count + 1, last_used_at = now();
  select used_count into v_used from public.chat_usage where usage_key = p_key and usage_day = p_day::date;
  return greatest(p_limit - v_used, 0);
end;
$$;

revoke all on function public.get_chat_quota(text, text, integer) from public, anon, authenticated;
revoke all on function public.consume_chat_quota(text, text, integer) from public, anon, authenticated;
grant execute on function public.get_chat_quota(text, text, integer) to service_role;
grant execute on function public.consume_chat_quota(text, text, integer) to service_role;