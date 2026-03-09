ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS meta_title text DEFAULT NULL;
ALTER TABLE public.lab_tests ADD COLUMN IF NOT EXISTS meta_description text DEFAULT NULL;