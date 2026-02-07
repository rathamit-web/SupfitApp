-- Supfit: Fix FK to auth.users and add RLS policies
-- Run this in Supabase SQL editor (Project -> SQL).

-- This version auto-detects the schema containing the tables to avoid
-- "schema public does not exist" errors in customized projects.

do $$
declare
  consent_schema text;
  profile_schema text;
begin
  -- Detect schemas for user_consent and user_profiles; default to 'public'
  select n.nspname into consent_schema
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'user_consent' and c.relkind = 'r'
  limit 1;

  select n.nspname into profile_schema
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where c.relname = 'user_profiles' and c.relkind = 'r'
  limit 1;

  if consent_schema is null then
    consent_schema := 'public';
  end if;
  if profile_schema is null then
    profile_schema := 'public';
  end if;

  -- 1) Ensure user_consent.user_id references auth.users(id)
  begin
    execute format('alter table if exists %I.user_consent drop constraint if exists user_consent_user_id_fkey', consent_schema);
    execute format('alter table if exists %I.user_consent alter column user_id set data type uuid using user_id::uuid', consent_schema);
    execute format('alter table if exists %I.user_consent add constraint user_consent_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade', consent_schema);
  exception when others then
    raise notice 'Skipping consent FK changes: %', sqlerrm;
  end;

  -- 2) Ensure user_profiles.id references auth.users(id)
  begin
    execute format('alter table if exists %I.user_profiles drop constraint if exists user_profiles_id_fkey', profile_schema);
    execute format('alter table if exists %I.user_profiles add constraint user_profiles_id_fkey foreign key (id) references auth.users(id) on delete cascade', profile_schema);
  exception when others then
    raise notice 'Skipping profiles FK changes: %', sqlerrm;
  end;

  -- 3) Enable RLS and policies (consent)
  begin
    execute format('alter table if exists %I.user_consent enable row level security', consent_schema);
    execute format('drop policy if exists insert_own_consent on %I.user_consent', consent_schema);
    execute format('create policy insert_own_consent on %I.user_consent for insert with check (auth.uid() = user_id)', consent_schema);
    execute format('drop policy if exists select_own_consent on %I.user_consent', consent_schema);
    execute format('create policy select_own_consent on %I.user_consent for select using (auth.uid() = user_id)', consent_schema);
    execute format('drop policy if exists update_own_consent on %I.user_consent', consent_schema);
    execute format('create policy update_own_consent on %I.user_consent for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', consent_schema);

    -- Grants required for PostgREST to access the schema and table (RLS still applies)
    execute format('grant usage on schema %I to anon, authenticated', consent_schema);
    execute format('grant select, insert, update on %I.user_consent to anon, authenticated', consent_schema);
  exception when others then
    raise notice 'Skipping consent policies: %', sqlerrm;
  end;

  -- 4) Enable RLS and policies (profiles)
  begin
    execute format('alter table if exists %I.user_profiles enable row level security', profile_schema);
    execute format('drop policy if exists upsert_own_profile on %I.user_profiles', profile_schema);
    execute format('create policy upsert_own_profile on %I.user_profiles for insert with check (auth.uid() = id)', profile_schema);
    execute format('drop policy if exists update_own_profile on %I.user_profiles', profile_schema);
    execute format('create policy update_own_profile on %I.user_profiles for update using (auth.uid() = id) with check (auth.uid() = id)', profile_schema);
    execute format('drop policy if exists select_own_profile on %I.user_profiles', profile_schema);
    execute format('create policy select_own_profile on %I.user_profiles for select using (auth.uid() = id)', profile_schema);

    -- Grants required for PostgREST to access the schema and table (RLS still applies)
    execute format('grant usage on schema %I to anon, authenticated', profile_schema);
    execute format('grant select, insert, update on %I.user_profiles to anon, authenticated', profile_schema);
  exception when others then
    raise notice 'Skipping profiles policies: %', sqlerrm;
  end;
end $$;
