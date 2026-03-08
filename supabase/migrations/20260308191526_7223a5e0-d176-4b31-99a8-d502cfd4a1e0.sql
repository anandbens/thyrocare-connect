
ALTER TABLE public.lab_tests 
ADD COLUMN IF NOT EXISTS test_code text,
ADD COLUMN IF NOT EXISTS parameters_grouped jsonb DEFAULT '[]'::jsonb;
