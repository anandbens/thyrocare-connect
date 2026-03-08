
CREATE OR REPLACE FUNCTION public.generate_test_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.test_code IS NULL OR NEW.test_code = '' THEN
    NEW.test_code := 'TC-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_test_code
  BEFORE INSERT ON public.lab_tests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_test_id();
