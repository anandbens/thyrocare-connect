import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { email, password } = await req.json();

    // Create the user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      // If user already exists, find them and assign admin role
      if (createError.message.includes('already been registered')) {
        const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = users.find((u: any) => u.email === email);
        if (existingUser) {
          // Assign admin role
          await supabaseAdmin.from('user_roles').upsert(
            { user_id: existingUser.id, role: 'admin' },
            { onConflict: 'user_id,role' }
          );
          return new Response(JSON.stringify({ success: true, message: 'Admin role assigned to existing user' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      throw createError;
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin.from('user_roles').upsert(
      { user_id: userData.user.id, role: 'admin' },
      { onConflict: 'user_id,role' }
    );

    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, userId: userData.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
