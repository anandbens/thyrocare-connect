import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      customer_name, customer_email, customer_phone,
      age, gender, address1, district, area, pincode,
      preferred_date, preferred_time, items, total_amount
    } = body;

    // Server-side validation
    const errors: string[] = [];

    if (!customer_name || typeof customer_name !== "string" || customer_name.trim().length < 2 || customer_name.length > 100) {
      errors.push("Invalid customer name");
    }
    if (!customer_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email) || customer_email.length > 255) {
      errors.push("Invalid email");
    }
    if (!customer_phone || !/^[6-9]\d{9}$/.test(customer_phone)) {
      errors.push("Invalid phone number");
    }
    if (age && (isNaN(Number(age)) || Number(age) < 1 || Number(age) > 99)) {
      errors.push("Invalid age");
    }
    if (!address1 || typeof address1 !== "string" || address1.trim().length < 3 || address1.length > 500) {
      errors.push("Invalid address");
    }
    if (!district || typeof district !== "string" || district.length > 100) {
      errors.push("Invalid district");
    }
    if (!area || typeof area !== "string" || area.length > 100) {
      errors.push("Invalid area");
    }
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      errors.push("Invalid pincode");
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      errors.push("No items in order");
    }
    if (!total_amount || isNaN(Number(total_amount)) || Number(total_amount) <= 0) {
      errors.push("Invalid total amount");
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ valid: false, errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify items exist and prices match
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const testIds = items.map((i: any) => i.test_id).filter(Boolean);
    if (testIds.length > 0) {
      const { data: dbTests } = await supabase
        .from("lab_tests")
        .select("id, price, is_active")
        .in("id", testIds);

      if (dbTests) {
        for (const item of items) {
          const dbTest = dbTests.find((t: any) => t.id === item.test_id);
          if (!dbTest) {
            errors.push(`Test ${item.test_name} not found`);
          } else if (!dbTest.is_active) {
            errors.push(`Test ${item.test_name} is no longer available`);
          } else if (Number(dbTest.price) !== Number(item.price)) {
            errors.push(`Price mismatch for ${item.test_name}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ valid: false, errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Validation error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ valid: false, errors: [msg] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
