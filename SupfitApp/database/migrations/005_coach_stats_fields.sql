-- Add years_experience and rating columns to coaches table
-- These are used for displaying coach stats in the UI

-- Add years_experience column (integer)
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0;

-- Add rating column (numeric with 1 decimal place, range 0-5)
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 4.5 
CHECK (rating >= 0 AND rating <= 5);

-- Add average_rating column for calculated ratings from reviews
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS average_rating numeric(2,1) DEFAULT NULL;

-- Add total_reviews column to track number of reviews
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;

-- Create index for filtering/sorting by rating
CREATE INDEX IF NOT EXISTS idx_coaches_rating ON public.coaches(rating);
CREATE INDEX IF NOT EXISTS idx_coaches_years_experience ON public.coaches(years_experience);

-- Comment for documentation
COMMENT ON COLUMN public.coaches.years_experience IS 'Years of coaching experience entered by the coach';
COMMENT ON COLUMN public.coaches.rating IS 'Current display rating (can be set by coach initially)';
COMMENT ON COLUMN public.coaches.average_rating IS 'Calculated average from client reviews';
COMMENT ON COLUMN public.coaches.total_reviews IS 'Total number of client reviews';
