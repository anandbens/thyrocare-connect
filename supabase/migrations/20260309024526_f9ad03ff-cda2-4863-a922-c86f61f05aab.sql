
-- Create a security definer function to lookup profile by phone for checkout prefill
CREATE OR REPLACE FUNCTION public.get_profile_by_phone(p_phone text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'full_name', p.full_name,
    'email', p.email,
    'phone', p.phone
  ) INTO v_result
  FROM profiles p
  WHERE p.phone = p_phone
  LIMIT 1;
  
  RETURN v_result;
END;
$$;
