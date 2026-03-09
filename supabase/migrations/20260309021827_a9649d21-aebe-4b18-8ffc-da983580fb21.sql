
CREATE OR REPLACE FUNCTION public.get_paginated_orders(
  p_page integer DEFAULT 1,
  p_per_page integer DEFAULT 15,
  p_search text DEFAULT NULL,
  p_order_status text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_date_from timestamp with time zone DEFAULT NULL,
  p_date_to timestamp with time zone DEFAULT NULL,
  p_tab text DEFAULT NULL,
  p_count_only boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_offset INTEGER;
  v_total BIGINT;
  v_results JSON;
  v_processed_statuses TEXT[] := ARRAY['confirmed','sample_collected','processing','completed'];
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_offset := (p_page - 1) * p_per_page;

  -- Count total matching rows
  SELECT COUNT(*) INTO v_total
  FROM orders o
  WHERE
    (p_order_status IS NULL OR o.order_status = p_order_status)
    AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
    AND (p_date_from IS NULL OR o.created_at >= p_date_from)
    AND (p_date_to IS NULL OR o.created_at <= p_date_to)
    AND (p_search IS NULL OR (
      o.customer_name ILIKE '%' || p_search || '%'
      OR o.customer_phone ILIKE '%' || p_search || '%'
      OR o.customer_email ILIKE '%' || p_search || '%'
      OR o.order_number ILIKE '%' || p_search || '%'
    ))
    AND (
      p_tab IS NULL
      OR (p_tab = 'new' AND NOT (o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses)))
      OR (p_tab = 'processed' AND o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses))
    );

  -- If count_only, return just the count
  IF p_count_only THEN
    RETURN json_build_object('total', v_total);
  END IF;

  -- Get paginated results with order_items
  SELECT json_build_object(
    'total', v_total,
    'page', p_page,
    'per_page', p_per_page,
    'total_pages', CEIL(v_total::NUMERIC / p_per_page),
    'data', COALESCE((
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT
          o.*,
          (
            SELECT json_agg(json_build_object(
              'id', oi.id,
              'order_id', oi.order_id,
              'test_id', oi.test_id,
              'test_name', oi.test_name,
              'price', oi.price,
              'original_price', oi.original_price
            ))
            FROM order_items oi
            WHERE oi.order_id = o.id
          ) AS order_items
        FROM orders o
        WHERE
          (p_order_status IS NULL OR o.order_status = p_order_status)
          AND (p_payment_status IS NULL OR o.payment_status = p_payment_status)
          AND (p_date_from IS NULL OR o.created_at >= p_date_from)
          AND (p_date_to IS NULL OR o.created_at <= p_date_to)
          AND (p_search IS NULL OR (
            o.customer_name ILIKE '%' || p_search || '%'
            OR o.customer_phone ILIKE '%' || p_search || '%'
            OR o.customer_email ILIKE '%' || p_search || '%'
            OR o.order_number ILIKE '%' || p_search || '%'
          ))
          AND (
            p_tab IS NULL
            OR (p_tab = 'new' AND NOT (o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses)))
            OR (p_tab = 'processed' AND o.payment_status = 'paid' AND o.order_status = ANY(v_processed_statuses))
          )
        ORDER BY o.created_at DESC
        LIMIT p_per_page
        OFFSET v_offset
      ) t
    ), '[]'::json)
  ) INTO v_results;

  RETURN v_results;
END;
$function$;
