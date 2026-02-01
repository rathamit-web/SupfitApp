-- Migration: Create user_targets table for daily and milestone fitness targets
-- This table stores user's daily targets (steps, running, sports, workout) and milestone targets
-- Created: January 31, 2025
-- Status: CRITICAL for My Targets feature

CREATE TABLE IF NOT EXISTS public.user_targets (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  
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

-- RLS Policy: Users can only SELECT their own targets
DROP POLICY IF EXISTS user_own_targets_select ON public.user_targets;
CREATE POLICY user_own_targets_select 
  ON public.user_targets 
  FOR SELECT 
  USING (user_id = auth.uid());

-- RLS Policy: Users can only INSERT their own targets
DROP POLICY IF EXISTS user_own_targets_insert ON public.user_targets;
CREATE POLICY user_own_targets_insert 
  ON public.user_targets 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

-- RLS Policy: Users can only UPDATE their own targets
DROP POLICY IF EXISTS user_own_targets_update ON public.user_targets;
CREATE POLICY user_own_targets_update 
  ON public.user_targets 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- RLS Policy: Users can DELETE their own targets (for GDPR data deletion)
DROP POLICY IF EXISTS user_own_targets_delete ON public.user_targets;
CREATE POLICY user_own_targets_delete 
  ON public.user_targets 
  FOR DELETE 
  USING (user_id = auth.uid());

-- Trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS trg_set_updated_at_user_targets ON public.user_targets;

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

-- Add trigger to log changes to audit_logs table (with error handling to prevent blocking updates)
DROP TRIGGER IF EXISTS trg_audit_user_targets_change ON public.user_targets;

CREATE OR REPLACE FUNCTION public.audit_user_targets_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only attempt audit logging if the audit_logs table exists
  -- Use PERFORM to avoid raising exceptions that would block the operation
  PERFORM 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'audit_logs';
  
  IF FOUND THEN
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
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore audit logging failures - they shouldn't block the main operation
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_user_targets_change
AFTER INSERT OR UPDATE OR DELETE ON public.user_targets
FOR EACH ROW
EXECUTE FUNCTION public.audit_user_targets_change();

-- Grant permissions to authenticated users
GRANT SELECT ON public.user_targets TO authenticated;
GRANT INSERT ON public.user_targets TO authenticated;
GRANT UPDATE ON public.user_targets TO authenticated;
GRANT DELETE ON public.user_targets TO authenticated;
GRANT USAGE ON SEQUENCE public.user_targets_id_seq TO authenticated;
