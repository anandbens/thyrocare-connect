
-- Drop and recreate the insert policy for orders to be explicit
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Also allow authenticated users to update their own orders (for payment status)
DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
CREATE POLICY "Users can update their orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Drop and recreate order_items insert policy
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
