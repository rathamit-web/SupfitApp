-- Enforce purpose-bound writes on health_vitals_raw using active consent

CREATE OR REPLACE FUNCTION public.enforce_consent_for_vitals()
RETURNS trigger AS $$
DECLARE
  consent_record public.consents%ROWTYPE;
  valid_until timestamptz;
BEGIN
  SELECT c.*, c.accepted_at + COALESCE(c.validity_period, INTERVAL '100 years') AS expires
  INTO consent_record
  FROM public.consents c
  WHERE c.user_id = NEW.user_id
    AND c.purpose = NEW.purpose
    AND c.withdrawn_at IS NULL
    AND c.accepted_at <= now()
  ORDER BY c.accepted_at DESC
  LIMIT 1;

  IF consent_record.id IS NULL THEN
    RAISE EXCEPTION 'No active consent found for purpose % for user %', NEW.purpose, NEW.user_id;
  END IF;

  valid_until := consent_record.accepted_at + COALESCE(consent_record.validity_period, INTERVAL '100 years');
  IF valid_until < now() THEN
    RAISE EXCEPTION 'Consent expired for purpose % for user %', NEW.purpose, NEW.user_id;
  END IF;

  -- Autofill consent_version if not provided
  IF NEW.consent_version IS NULL THEN
    NEW.consent_version := consent_record.consent_version;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_vitals_consent ON public.health_vitals_raw;
CREATE TRIGGER trg_vitals_consent
BEFORE INSERT OR UPDATE ON public.health_vitals_raw
FOR EACH ROW EXECUTE FUNCTION public.enforce_consent_for_vitals();
