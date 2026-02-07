-- Migration: Move user_consent and user_profiles from extensions to public schema
-- 1. Create tables in public schema (structure only)
create table if not exists public.user_consent (like extensions.user_consent including all);
create table if not exists public.user_profiles (like extensions.user_profiles including all);

-- 2. Copy data
insert into public.user_consent select * from extensions.user_consent on conflict do nothing;
insert into public.user_profiles select * from extensions.user_profiles on conflict do nothing;

-- 3. Recreate foreign keys (if not auto-copied)
alter table public.user_consent drop constraint if exists user_consent_user_id_fkey;
alter table public.user_consent add constraint user_consent_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.user_profiles drop constraint if exists user_profiles_id_fkey;
alter table public.user_profiles add constraint user_profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade;

-- 4. Enable RLS and policies
alter table public.user_consent enable row level security;
drop policy if exists insert_own_consent on public.user_consent;
create policy insert_own_consent on public.user_consent for insert with check (auth.uid() = user_id);
drop policy if exists select_own_consent on public.user_consent;
create policy select_own_consent on public.user_consent for select using (auth.uid() = user_id);
drop policy if exists update_own_consent on public.user_consent;
create policy update_own_consent on public.user_consent for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.user_profiles enable row level security;
drop policy if exists upsert_own_profile on public.user_profiles;
create policy upsert_own_profile on public.user_profiles for insert with check (auth.uid() = id);
drop policy if exists update_own_profile on public.user_profiles;
create policy update_own_profile on public.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists select_own_profile on public.user_profiles;
create policy select_own_profile on public.user_profiles for select using (auth.uid() = id);

-- 5. Grant privileges
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.user_consent to anon, authenticated;
grant select, insert, update on public.user_profiles to anon, authenticated;

-- 6. (Optional) Drop old tables after verifying migration
-- drop table extensions.user_consent;
-- drop table extensions.user_profiles;

-- 7. (Optional) Remove old policies from extensions schema
-- drop policy if exists ... on extensions.user_consent;
-- drop policy if exists ... on extensions.user_profiles;

-- End of migration
