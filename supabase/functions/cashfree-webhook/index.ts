import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "payment_gateways_secret")
      .single();

    const gateways = settingsData?.setting_value as any;
    const config = gateways?.cashfree;

    if (!config?.secret_key) {
      console.error("Cashfree not configured");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // Verify webhook signature using HMAC-SHA256
    const timestamp = req.headers.get("x-webhook-timestamp") || "";
    const signature = req.headers.get("x-webhook-signature") || "";

    if (signature) {
      const signaturePayload = timestamp + rawBody;
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(config.secret_key),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const sig = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(signaturePayload)
      );
      const computedSignature = btoa(
        String.fromCharCode(...new Uint8Array(sig))
      );

      if (computedSignature !== signature) {
        console.error("Invalid Cashfree webhook signature");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const eventType = payload.type;
    const orderData = payload.data?.order;

    if (!orderData) {
      return new Response(JSON.stringify({ ok: true, message: "No order data" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfOrderId = orderData.order_id || "";
    const parts = cfOrderId.split("_");
    const orderId = parts.length >= 3 ? parts.slice(1, -1).join("_") : null;

    if (!orderId) {
      console.error("Could not extract order_id from cf_order_id:", cfOrderId);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Cashfree webhook: event=${eventType}, orderId=${orderId}, status=${orderData.order_status}`);

    if (eventType === "PAYMENT_SUCCESS_WEBHOOK" || orderData.order_status === "PAID") {
      await supabase.from("orders").update({
        payment_status: "paid",
        payment_id: `cashfree_${cfOrderId}`,
        order_status: "confirmed",
      }).eq("id", orderId);
    } else if (
      orderData.order_status === "EXPIRED" ||
      orderData.order_status === "TERMINATED" ||
      eventType === "PAYMENT_FAILED_WEBHOOK"
    ) {
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.payment_status !== "paid") {
        await supabase.from("orders").update({
          payment_status: "failed",
        }).eq("id", orderId);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cashfree webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
