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

    // Get PhonePe config
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "payment_gateways")
      .single();

    const gateways = settingsData?.setting_value as any;
    const config = gateways?.phonepe;

    if (!config?.client_id || !config?.client_secret) {
      console.error("PhonePe not configured");
      return new Response(JSON.stringify({ error: "Not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawBody = await req.text();

    // PhonePe S2S callback sends authorization header for verification
    // Verify using the PhonePe username/password or signature based on integration type
    const authHeader = req.headers.get("authorization") || "";

    // For PhonePe PG Checkout v2, the S2S callback includes a standard auth header
    // We verify by checking the order status via API as the authoritative source
    const payload = JSON.parse(rawBody);

    // PhonePe S2S callback payload structure
    const eventType = payload.type || payload.event;
    const merchantOrderId = payload.payload?.merchantOrderId || payload.merchantOrderId || "";
    const state = payload.payload?.state || payload.state || "";

    // Extract our order_id from merchantOrderId (format: ORDER-{uuid}-{timestamp})
    const parts = merchantOrderId.split("-");
    // ORDER-{uuid}-{timestamp}
    const orderId = parts.length >= 3 ? parts.slice(1, -1).join("-") : null;

    if (!orderId) {
      console.log("PhonePe webhook: could not extract order_id from", merchantOrderId);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`PhonePe webhook: merchantOrderId=${merchantOrderId}, orderId=${orderId}, state=${state}`);

    // Double-check by calling PhonePe status API for authoritative confirmation
    const baseUrl = config.is_sandbox
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/pg";

    const authUrl = config.is_sandbox
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/identity-manager";

    // Get OAuth token
    const tokenResponse = await fetch(`${authUrl}/v1/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: config.client_id,
        client_secret: config.client_secret,
        client_version: config.client_version || "1",
        grant_type: "client_credentials",
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Check order status via API
    const statusResponse = await fetch(
      `${baseUrl}/checkout/v2/order/${merchantOrderId}/status`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    const confirmedState = statusData.state;

    console.log(`PhonePe webhook: confirmed state=${confirmedState} for ${merchantOrderId}`);

    if (confirmedState === "COMPLETED") {
      await supabase.from("orders").update({
        payment_status: "paid",
        payment_id: `phonepe_${merchantOrderId}`,
        order_status: "confirmed",
      }).eq("id", orderId);

      console.log(`Order ${orderId} marked as paid via PhonePe webhook`);
    } else if (confirmedState === "FAILED") {
      // Only update if not already paid
      const { data: existingOrder } = await supabase
        .from("orders")
        .select("payment_status")
        .eq("id", orderId)
        .single();

      if (existingOrder?.payment_status !== "paid") {
        await supabase.from("orders").update({
          payment_status: "failed",
        }).eq("id", orderId);

        console.log(`Order ${orderId} marked as failed via PhonePe webhook`);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PhonePe webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
