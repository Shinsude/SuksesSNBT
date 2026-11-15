-- Restrict direct table privileges to the authenticated application role.
-- Row-level security continues to enforce per-user ownership for every row.
revoke all privileges on table public.profiles, public.progress_entries from anon;
revoke all privileges on table public.profiles, public.progress_entries from authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, insert, update on table public.progress_entries to authenticated;

-- This function is invoked by the existing auth.users trigger only.
-- Prevent direct invocation by API roles; the trigger remains installed.
revoke execute on function public.handle_new_snbt_user() from public, anon, authenticated;
