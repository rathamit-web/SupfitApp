-- Views to expose assigned clients per coach/dietitian (derived from assignment tables)
CREATE OR REPLACE VIEW public.coach_assigned_clients AS
SELECT
  cca.coach_id,
  cca.client_user_id,
  cca.scope,
  cca.expires_at,
  cca.created_at,
  cca.updated_at
FROM public.coach_client_assignments cca;

CREATE OR REPLACE VIEW public.dietitian_assigned_clients AS
SELECT
  dca.dietitian_id,
  dca.client_user_id,
  dca.scope,
  dca.expires_at,
  dca.created_at,
  dca.updated_at
FROM public.dietitian_client_assignments dca;

-- RLS is not applied to views directly; underlying tables enforce access via RLS policies.
