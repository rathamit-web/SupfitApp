-- Consent table + enforcement trigger for derived Active Hours ingestion

-- 1) Minimal consent model (owner-scoped)
create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  scope text not null,
  purpose text not null,
  granted boolean not null default false,
  granted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint consents_scope_len check (char_length(scope) between 1 and 64),
  constraint consents_purpose_len check (char_length(purpose) between 1 and 128)
);

create unique index if not exists consents_owner_scope_purpose_uidx
  on public.consents (owner_id, scope, purpose);

alter table public.consents enable row level security;

-- User can read/manage their own consent records
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'consents'
      and policyname = 'consents_select_own'
  ) then
    create policy "consents_select_own"
      on public.consents for select
      using (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'consents'
      and policyname = 'consents_insert_own'
  ) then
    create policy "consents_insert_own"
      on public.consents for insert
      with check (auth.uid() = owner_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'consents'
      and policyname = 'consents_update_own'
  ) then
    create policy "consents_update_own"
      on public.consents for update
      using (auth.uid() = owner_id)
      with check (auth.uid() = owner_id);
  end if;
end;
$$;

-- updated_at trigger (function may already exist from prior migrations)
do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'set_updated_at'
      and pg_function_is_visible(oid)
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at = now();
      return new;
    end;
    $fn$;
  end if;
end;
$$;

drop trigger if exists trg_consents_updated_at on public.consents;
create trigger trg_consents_updated_at
before update on public.consents
for each row execute procedure public.set_updated_at();

-- 2) DB-level enforcement: active_hours writes require active consent
create or replace function public.enforce_consent_for_active_hours()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  has_consent boolean;
begin
  select exists (
    select 1
    from public.consents c
    where c.owner_id = new.owner_id
      and c.scope = 'active_hours'
      and c.purpose = 'active_hours_ingest'
      and c.granted = true
      and c.revoked_at is null
      and (c.expires_at is null or c.expires_at > now())
  ) into has_consent;

  if not has_consent then
    raise exception 'Consent required for active_hours_ingest'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_active_hours_consent on public.active_hours;
create trigger trg_active_hours_consent
before insert or update on public.active_hours
for each row execute procedure public.enforce_consent_for_active_hours();
