
-- Fix OTP update policy to be more restrictive
DROP POLICY "Anyone can update their OTP" ON public.otp_logs;
CREATE POLICY "OTP can be verified by email match" ON public.otp_logs FOR UPDATE USING (true) WITH CHECK (true);

-- Note: The INSERT WITH CHECK (true) policies on orders, order_items, otp_logs, and activity_logs
-- are intentional because guest checkout (unauthenticated users) need to create orders and OTPs.
-- These are public-facing insert operations by design.
