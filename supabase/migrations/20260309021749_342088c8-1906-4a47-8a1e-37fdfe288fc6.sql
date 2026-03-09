
-- Indexes for orders table to support filtering and sorting at scale
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);

-- Composite index for the "processed" tab filter (payment_status + order_status)
CREATE INDEX IF NOT EXISTS idx_orders_payment_order_status ON public.orders (payment_status, order_status);

-- Composite index for search patterns
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);

-- Index for order_items lookup by order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
