-- =========================================================
-- Extend user_settings for account preferences
-- =========================================================

ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS consents jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS retention jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS two_factor jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS address jsonb NOT NULL DEFAULT '{}'::jsonb;
