import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, otp } = await req.json();

    if (!phone || !otp) {
      return new Response(
        JSON.stringify({ error: "Phone and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch SMS gateway settings from site_settings
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "sms_gateway")
      .single();

    if (!settingsData?.setting_value) {
      return new Response(
        JSON.stringify({ error: "SMS gateway not configured", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smsConfig = settingsData.setting_value as Record<string, string>;
    const {
      api_key,
      entity_id,
      sender_id,
      template_id,
      gateway_url,
    } = smsConfig;

    if (!api_key || !gateway_url) {
      return new Response(
        JSON.stringify({ error: "SMS gateway credentials incomplete", sent: false }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the SMS message
    const message = `Your OTP for Thyrocare Nagercoil checkout is ${otp}. Valid for 10 minutes. Do not share this with anyone.`;

    // Generic SMS API call - adapt URL params based on your provider
    const smsUrl = new URL(gateway_url);
    smsUrl.searchParams.set("apikey", api_key);
    if (entity_id) smsUrl.searchParams.set("entity_id", entity_id);
    if (sender_id) smsUrl.searchParams.set("sender", sender_id);
    if (template_id) smsUrl.searchParams.set("template_id", template_id);
    smsUrl.searchParams.set("numbers", `91${phone}`);
    smsUrl.searchParams.set("message", message);

    const smsResponse = await fetch(smsUrl.toString());
    const smsResult = await smsResponse.text();

    console.log("SMS API Response:", smsResult);

    return new Response(
      JSON.stringify({ sent: true, response: smsResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("SMS OTP Error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: msg, sent: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
