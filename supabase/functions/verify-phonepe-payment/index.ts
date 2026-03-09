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
    const config = gateways?.phonepe;

    if (!config?.client_id || !config?.client_secret) {
      return new Response(
        JSON.stringify({ error: "PhonePe not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let order_id: string, merchant_order_id: string;

    if (req.method === "GET") {
      const url = new URL(req.url);
      order_id = url.searchParams.get("order_id") || "";
      merchant_order_id = url.searchParams.get("merchant_order_id") || "";
    } else {
      const body = await req.json();
      order_id = body.order_id;
      merchant_order_id = body.merchant_order_id;
    }

    if (!order_id || !merchant_order_id) {
      return new Response(
        JSON.stringify({ error: "Missing order_id or merchant_order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = config.is_sandbox
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/pg";

    const authUrl = config.is_sandbox
      ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
      : "https://api.phonepe.com/apis/identity-manager";

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

    const statusResponse = await fetch(
      `${baseUrl}/checkout/v2/order/${merchant_order_id}/status`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `O-Bearer ${accessToken}`,
        },
      }
    );

    const statusData = await statusResponse.json();
    const paymentState = statusData.state;

    if (paymentState === "COMPLETED") {
      await supabase.from("orders").update({
        payment_status: "paid",
        payment_id: `phonepe_${merchant_order_id}`,
        order_status: "confirmed",
      }).eq("id", order_id);

      if (req.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: { Location: `/dashboard/orders?payment=success` },
        });
      }

      return new Response(
        JSON.stringify({ verified: true, state: paymentState }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      if (paymentState === "FAILED") {
        await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order_id);
      }

      if (req.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: { Location: `/dashboard/orders?payment=failed` },
        });
      }

      return new Response(
        JSON.stringify({ verified: false, state: paymentState }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
