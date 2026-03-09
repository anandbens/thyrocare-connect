import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

function playNotificationSound() {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
}

function showBrowserNotification(orderNumber: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification("🧪 New Order Received!", {
      body: `Order ${orderNumber} has been placed.`,
      icon: "/favicon.ico",
    });
  }
}

export function useNewOrderCount() {
  const [count, setCount] = useState(0);
  const prevCountRef = useRef(0);
  const initializedRef = useRef(false);

  const fetchCount = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_paginated_orders", {
      p_page: 1,
      p_per_page: 1,
      p_search: null,
      p_order_status: "received",
      p_payment_status: null,
      p_date_from: null,
      p_date_to: null,
    });
    if (!error && data) {
      const result = data as any;
      const newCount = result?.total || 0;
      setCount(newCount);

      // Only alert if count increased after initial load
      if (initializedRef.current && newCount > prevCountRef.current) {
        playNotificationSound();
      }
      prevCountRef.current = newCount;
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Request notification permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    fetchCount();
    const interval = setInterval(fetchCount, 30000);

    // Realtime subscription for instant detection
    const channel = supabase
      .channel("admin-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const order = payload.new as any;
          playNotificationSound();
          showBrowserNotification(order.order_number || "New");
          // Refresh count
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  return count;
}
