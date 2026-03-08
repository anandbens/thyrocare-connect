import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useNewOrderCount() {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    // New orders = NOT (paid AND confirmed/sample_collected/processing/completed)
    const { data, error } = await supabase.rpc("get_paginated_orders", {
      p_page: 1,
      p_per_page: 1,
      p_search: null,
      p_order_status: null,
      p_payment_status: null,
      p_date_from: null,
      p_date_to: null,
    });
    if (!error && data) {
      const result = data as any;
      const allOrders = result.total || 0;
      // Fetch processed count
      const { data: processedData } = await supabase.rpc("get_paginated_orders", {
        p_page: 1,
        p_per_page: 1,
        p_search: null,
        p_order_status: null,
        p_payment_status: "paid",
        p_date_from: null,
        p_date_to: null,
      });
      const processedResult = processedData as any;
      // We need a different approach - let's just count non-processed orders
      // New = received status with any payment
      const { data: newData } = await supabase.rpc("get_paginated_orders", {
        p_page: 1,
        p_per_page: 1,
        p_search: null,
        p_order_status: "received",
        p_payment_status: null,
        p_date_from: null,
        p_date_to: null,
      });
      const newResult = newData as any;
      setCount(newResult?.total || 0);
    }
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return count;
}
