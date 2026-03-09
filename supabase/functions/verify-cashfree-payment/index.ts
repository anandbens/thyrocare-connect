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

    if (!config?.app_id || !config?.secret_key) {
      return new Response(
        JSON.stringify({ error: "Cashfree not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let order_id: string, cf_order_id: string;

    if (req.method === "GET") {
      const url = new URL(req.url);
      order_id = url.searchParams.get("order_id") || "";
      cf_order_id = url.searchParams.get("cf_order_id") || "";
    } else {
      const body = await req.json();
      order_id = body.order_id;
      cf_order_id = body.cf_order_id;
    }

    if (!order_id || !cf_order_id) {
      return new Response(
        JSON.stringify({ error: "Missing order_id or cf_order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = config.is_sandbox
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";

    // Check order status
    const statusResponse = await fetch(`${baseUrl}/orders/${cf_order_id}`, {
      headers: {
        "x-client-id": config.app_id,
        "x-client-secret": config.secret_key,
        "x-api-version": "2022-09-01",
      },
    });

    const statusData = await statusResponse.json();
    const orderStatus = statusData.order_status;

    if (orderStatus === "PAID") {
      await supabase.from("orders").update({
        payment_status: "paid",
        payment_id: `cashfree_${cf_order_id}`,
        order_status: "confirmed",
      }).eq("id", order_id);

      if (req.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: { Location: `/dashboard/orders?payment=success` },
        });
      }

      return new Response(
        JSON.stringify({ verified: true, status: orderStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      if (orderStatus === "EXPIRED" || orderStatus === "TERMINATED") {
        await supabase.from("orders").update({ payment_status: "failed" }).eq("id", order_id);
      }

      if (req.method === "GET") {
        return new Response(null, {
          status: 302,
          headers: { Location: `/dashboard/orders?payment=failed` },
        });
      }

      return new Response(
        JSON.stringify({ verified: false, status: orderStatus }),
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
