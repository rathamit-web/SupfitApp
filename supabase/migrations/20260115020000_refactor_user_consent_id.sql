-- Refactor user_consent table to follow best practices: use uuid as primary key, remove unnecessary integer id

-- 1. Add a new uuid column if not present
alter table public.user_consent add column if not exists consent_id uuid default gen_random_uuid();

-- 2. Set consent_id as primary key (if not already)
alter table public.user_consent drop constraint if exists user_consent_pkey;
alter table public.user_consent add primary key (consent_id);

-- 3. Remove old integer id column if not needed
alter table public.user_consent drop column if exists id;

-- 4. (Optional) Remove sequence if it exists
-- drop sequence if exists public.user_consent_id_seq;

-- 5. Ensure user_id is still uuid and FK to auth.users
alter table public.user_consent alter column user_id set data type uuid using user_id::uuid;

-- 6. (Optional) Update app/backend to use consent_id (uuid) as the identifier for user_consent rows

-- End of migration
