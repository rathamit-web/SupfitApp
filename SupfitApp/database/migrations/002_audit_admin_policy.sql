-- Admin visibility into audit_log gated by JWT claims (role=admin and mfa=true)
-- Assumes JWT contains custom claims: role, mfa (boolean or string 'true').

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_deny_all ON public.audit_log;

CREATE POLICY audit_log_admin_read ON public.audit_log
FOR SELECT USING (
  coalesce((current_setting('request.jwt.claim.role', true))::text, '') = 'admin'
  AND coalesce((current_setting('request.jwt.claim.mfa', true))::text, '') = 'true'
);

-- Optional: allow insert from trusted service role (Edge Functions) while keeping table append-only.
CREATE POLICY IF NOT EXISTS audit_log_service_insert ON public.audit_log
FOR INSERT WITH CHECK (
  current_setting('request.jwt.claim.role', true) = 'service_role'
);
