-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPFIT: Create user_targets Table for My Targets Feature
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- This migration creates the critical user_targets table for the My Targets feature.
-- It includes:
--   • Daily targets (steps, running, sports, workout)
--   • Milestone targets (description, month, year)
--   • Row Level Security (RLS) for user privacy
--   • Auto-audit logging via triggers
--   • Data integrity constraints
--   • Updated_at auto-update trigger
--
-- To apply: Paste this entire script into Supabase SQL Editor and click RUN
-- ═══════════════════════════════════════════════════════════════════════════════

-- Create the user_targets table
CREATE TABLE IF NOT EXISTS public.user_targets (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  
  -- Daily fitness targets
  steps int DEFAULT 8000,
  running int DEFAULT 5,  -- kilometers per day
  sports int DEFAULT 60,  -- minutes per day
  workout int DEFAULT 60, -- minutes per day
  
  -- Milestone targets
  milestone text DEFAULT '',
  milestone_month text DEFAULT '',
  milestone_year text DEFAULT '',
  
  -- Timestamps for audit and sync
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Constraints for data integrity
  CONSTRAINT valid_steps CHECK (steps >= 1000 AND steps <= 20000),
  CONSTRAINT valid_running CHECK (running >= 1 AND running <= 20),
  CONSTRAINT valid_sports CHECK (sports >= 15 AND sports <= 180),
  CONSTRAINT valid_workout CHECK (workout >= 15 AND workout <= 180)
);

-- Create index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_targets_user_id 
  ON public.user_targets(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_targets ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- RLS Policy: Users can only SELECT their own targets
CREATE POLICY user_own_targets_select 
  ON public.user_targets 
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS Policy: Users can only INSERT their own targets
CREATE POLICY user_own_targets_insert 
  ON public.user_targets 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can only UPDATE their own targets
CREATE POLICY user_own_targets_update 
  ON public.user_targets 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- RLS Policy: Users can DELETE their own targets (for GDPR data deletion)
CREATE POLICY user_own_targets_delete 
  ON public.user_targets 
  FOR DELETE 
  USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGERS FOR AUTOMATION
-- ═══════════════════════════════════════════════════════════════════════════════

-- Trigger to auto-update updated_at timestamp on modifications
CREATE OR REPLACE FUNCTION public.set_updated_at_user_targets()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_updated_at_user_targets
BEFORE UPDATE ON public.user_targets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_user_targets();

-- Trigger to log all changes to audit_logs table for compliance
CREATE OR REPLACE FUNCTION public.audit_user_targets_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, entity_type, entity_id, details, created_at)
  VALUES (
    NEW.user_id,
    'user_targets',
    NEW.user_id::text,
    jsonb_build_object(
      'action', TG_OP,
      'old_values', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
      'new_values', to_jsonb(NEW),
      'changed_fields', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_object_keys(to_jsonb(NEW) - to_jsonb(OLD)) 
        ELSE '{}'::text[] 
      END
    ),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_user_targets_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_targets
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_targets_change();

-- ═══════════════════════════════════════════════════════════════════════════════
-- PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Grant full permissions to authenticated users (filtered by RLS policies)
GRANT SELECT ON public.user_targets TO authenticated;
GRANT INSERT ON public.user_targets TO authenticated;
GRANT UPDATE ON public.user_targets TO authenticated;
GRANT DELETE ON public.user_targets TO authenticated;
GRANT USAGE ON SEQUENCE public.user_targets_id_seq TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES (Run after migration to verify success)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Verify table was created:
-- SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_targets');
-- Expected: true

-- 2. Verify RLS policies exist:
-- SELECT tablename, policyname FROM pg_policies WHERE tablename = 'user_targets' ORDER BY policyname;
-- Expected: 4 rows (select, insert, update, delete)

-- 3. Verify triggers exist:
-- SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'user_targets';
-- Expected: 2 rows (trg_set_updated_at_user_targets, trg_audit_user_targets_change)

-- 4. Verify index was created:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'user_targets';
-- Expected: idx_user_targets_user_id

-- ═══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ═══════════════════════════════════════════════════════════════════════════════
