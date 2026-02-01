# Database Migration Application Guide

## ⚠️ IMPORTANT: Manual SQL Execution Required

Due to environment limitations, the migration must be executed manually in the Supabase SQL Editor. Follow these steps:

---

## Step 1: Access Supabase Console

1. Go to [https://console.supabase.com](https://console.supabase.com)
2. Sign in with your account
3. Select the **SupfitApp** project
4. Navigate to **SQL Editor** (left sidebar)

---

## Step 2: Execute the Migration SQL

### Option A: Copy-Paste Method (Easiest)

1. In SQL Editor, click **New query**
2. Copy the entire SQL below (or from `supabase/migrations/20250131_create_user_targets.sql`)
3. Paste into the SQL editor
4. Click **RUN** button
5. Wait for success message

### Option B: Upload Migration File

1. If your Supabase allows, upload the file:
   - Location: `SupfitApp/supabase/migrations/20250131_create_user_targets.sql`
2. Execute in the SQL editor

---

## Step 3: Verify Migration Success

Run this query in a new SQL Editor tab to verify:

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'user_targets' 
  AND table_schema = 'public'
);
```

**Expected result:** `true` ✅

---

## Migration SQL to Execute

```sql
-- Migration: Create user_targets table for daily and milestone fitness targets
-- This table stores user's daily targets (steps, running, sports, workout) and milestone targets
-- Created: January 31, 2025
-- Status: CRITICAL for My Targets feature

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

-- Trigger to auto-update updated_at timestamp
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

-- Add trigger to log changes to audit_logs table
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

-- Grant permissions to authenticated users
GRANT SELECT ON public.user_targets TO authenticated;
GRANT INSERT ON public.user_targets TO authenticated;
GRANT UPDATE ON public.user_targets TO authenticated;
GRANT DELETE ON public.user_targets TO authenticated;
GRANT USAGE ON SEQUENCE public.user_targets_id_seq TO authenticated;
```

---

## Verification Checklist After Migration

✅ **Table Created:**
```sql
SELECT * FROM public.user_targets LIMIT 1;
```
Should show table structure or empty result (no error).

✅ **RLS Policies Enabled:**
```sql
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'user_targets';
```
Should show 4 policies: select, insert, update, delete

✅ **Triggers Created:**
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'user_targets';
```
Should show 2 triggers: `trg_set_updated_at_user_targets` and `trg_audit_user_targets_change`

✅ **Index Created:**
```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'user_targets';
```
Should show index: `idx_user_targets_user_id`

---

## Troubleshooting

### Error: "Cannot find table 'audit_logs'"
**Solution:** The `audit_logs` table must exist first. It's likely already in your database. If not, create it:
```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### Error: "Users table does not exist"
**Solution:** The `users` table should already exist (created by Supabase Auth). Verify:
```sql
SELECT * FROM public.users LIMIT 1;
```

### Error: "Policy already exists"
**Solution:** This is usually safe. The migration uses `CREATE POLICY IF NOT EXISTS` implicitly. If errors persist, drop and recreate:
```sql
DROP POLICY IF EXISTS user_own_targets_select ON public.user_targets;
DROP POLICY IF EXISTS user_own_targets_insert ON public.user_targets;
DROP POLICY IF EXISTS user_own_targets_update ON public.user_targets;
DROP POLICY IF EXISTS user_own_targets_delete ON public.user_targets;
```
Then re-run the migration.

---

## Post-Migration Steps

1. ✅ Verify table created
2. ✅ Test with app: `npm run dev`
3. ✅ Navigate to My Targets screen
4. ✅ Set targets and click Save
5. ✅ Verify success message appears
6. ✅ Close and reopen app
7. ✅ Verify targets persist

---

## Support

If you encounter issues:
1. Check Supabase dashboard for error messages
2. Verify RLS policies are correctly set
3. Ensure `users` and `audit_logs` tables exist
4. Check recent activity in the SQL Editor history

**Reference:** [MY_TARGETS_IMPLEMENTATION_GUIDE.md](../MY_TARGETS_IMPLEMENTATION_GUIDE.md)

---

*Migration Date: January 31, 2025*  
*Status: Ready for manual execution in Supabase console*
