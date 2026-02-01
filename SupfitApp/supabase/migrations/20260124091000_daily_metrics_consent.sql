-- =========================================================
-- Consent enforcement for daily_metrics ingestion
-- =========================================================

create or replace function public.enforce_consent_for_daily_metrics()
returns trigger as $$
begin
  if not exists (
    select 1
    from public.consents c
    where c.owner_id = new.owner_id
      and c.scope = 'daily_metrics'
      and c.purpose = 'daily_metrics_ingest'
      and c.granted = true
      and c.revoked_at is null
      and (c.expires_at is null or c.expires_at > now())
  ) then
    raise exception 'Consent required for daily_metrics_ingest';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_daily_metrics_consent on public.daily_metrics;
create trigger trg_daily_metrics_consent
before insert or update on public.daily_metrics
for each row execute procedure public.enforce_consent_for_daily_metrics();
