-- Create workout_programs table for AI-generated and coach-assigned workout plans
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('ai_generated', 'coach_assigned')),
  plan_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_workout_programs_user_id ON public.workout_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_is_active ON public.workout_programs(is_active);

-- Enable Row Level Security
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workout programs
CREATE POLICY "Users can view their own workout programs"
  ON public.workout_programs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own workout programs
CREATE POLICY "Users can insert their own workout programs"
  ON public.workout_programs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own workout programs
CREATE POLICY "Users can update their own workout programs"
  ON public.workout_programs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own workout programs
CREATE POLICY "Users can delete their own workout programs"
  ON public.workout_programs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workout_programs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
CREATE TRIGGER workout_programs_updated_at
  BEFORE UPDATE ON public.workout_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_workout_programs_updated_at();

COMMENT ON TABLE public.workout_programs IS 'Stores AI-generated and coach-assigned workout programs for users';
COMMENT ON COLUMN public.workout_programs.plan_type IS 'Type of workout plan: ai_generated or coach_assigned';
COMMENT ON COLUMN public.workout_programs.plan_data IS 'JSONB containing full workout plan details including exercises, schedules, and recommendations';
COMMENT ON COLUMN public.workout_programs.is_active IS 'Whether this plan is currently active for the user';
