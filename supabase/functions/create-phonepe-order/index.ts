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

    if (!config?.enabled || !config?.client_id || !config?.client_secret || !config?.merchant_id) {
      return new Response(
        JSON.stringify({ error: "PhonePe is not configured or enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, order_id, redirect_url } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = config.is_sandbox
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/pg";

    const authUrl = config.is_sandbox
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/identity-manager";

    // Step 1: Get OAuth token
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

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("PhonePe auth error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with PhonePe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Step 2: Create payment
    const merchantOrderId = `ORDER-${order_id}-${Date.now()}`;
    const paymentPayload = {
      merchantOrderId,
      amount: Math.round(amount * 100), // in paise
      expireAfter: 1200, // 20 minutes
      paymentFlow: {
        type: "PG_CHECKOUT",
        merchantUrls: {
          redirectUrl: redirect_url || `${Deno.env.get("SUPABASE_URL")}/functions/v1/verify-phonepe-payment?order_id=${order_id}&merchant_order_id=${merchantOrderId}`,
        },
      },
    };

    const payResponse = await fetch(`${baseUrl}/checkout/v2/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!payResponse.ok) {
      const err = await payResponse.text();
      console.error("PhonePe pay error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to create PhonePe payment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payData = await payResponse.json();

    return new Response(
      JSON.stringify({
        redirect_url: payData.redirectUrl,
        order_id: payData.orderId,
        merchant_order_id: merchantOrderId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
