
-- Allow anyone to read orders by phone (for pre-fill during checkout)
CREATE POLICY "Anyone can read orders by phone for prefill" ON public.orders
FOR SELECT TO anon, authenticated
USING (true);
