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
      .eq("setting_key", "payment_gateways")
      .single();

    const gateways = settingsData?.setting_value as any;
    const config = gateways?.cashfree;

    if (!config?.enabled || !config?.app_id || !config?.secret_key) {
      return new Response(
        JSON.stringify({ error: "Cashfree is not configured or enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, order_id, customer_name, customer_email, customer_phone, return_url } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = config.is_sandbox
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";

    const cfOrderId = `cf_${order_id}_${Date.now()}`;

    const orderPayload = {
      order_id: cfOrderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: order_id,
        customer_name: customer_name || "Customer",
        customer_email: customer_email || "customer@example.com",
        customer_phone: customer_phone || "9999999999",
      },
      order_meta: {
        return_url: return_url || `${supabaseUrl}/functions/v1/verify-cashfree-payment?order_id=${order_id}&cf_order_id=${cfOrderId}`,
      },
    };

    const cfResponse = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": config.app_id,
        "x-client-secret": config.secret_key,
        "x-api-version": "2022-09-01",
      },
      body: JSON.stringify(orderPayload),
    });

    if (!cfResponse.ok) {
      const err = await cfResponse.text();
      console.error("Cashfree error:", err);
      return new Response(
        JSON.stringify({ error: "Failed to create Cashfree order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cfData = await cfResponse.json();

    return new Response(
      JSON.stringify({
        payment_session_id: cfData.payment_session_id,
        cf_order_id: cfOrderId,
        order_id: cfData.cf_order_id,
        is_sandbox: config.is_sandbox,
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
