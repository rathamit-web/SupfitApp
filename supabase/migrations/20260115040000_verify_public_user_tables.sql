-- Verify user_consent and user_profiles in public schema

-- 1. List tables
select table_schema, table_name from information_schema.tables where table_schema = 'public' and table_name in ('user_consent','user_profiles');

-- 2. Check row counts
select 'user_consent' as table, count(*) from public.user_consent
union all
select 'user_profiles', count(*) from public.user_profiles;

-- 3. Check column types
select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' and table_name in ('user_consent','user_profiles');

-- 4. List foreign keys
select conname, conrelid::regclass, confrelid::regclass from pg_constraint where conrelid::regclass::text in ('public.user_consent','public.user_profiles') and contype = 'f';

-- 5. RLS status
select relname, relrowsecurity, relforcerowsecurity from pg_class where relname in ('user_consent','user_profiles');

-- 6. List policies
select * from pg_policies where schemaname = 'public' and tablename in ('user_consent','user_profiles');

-- 7. Privileges
select grantee, privilege_type, table_schema, table_name from information_schema.role_table_grants where table_schema = 'public' and table_name in ('user_consent','user_profiles');

-- End of verification
