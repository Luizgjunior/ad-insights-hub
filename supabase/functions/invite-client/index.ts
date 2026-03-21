import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const action = body.action || 'invite_client';

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller is admin_global
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user && (action === 'create_gestor' || action === 'delete_gestor')) {
        const { data: callerProfile } = await supabaseAdmin
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!callerProfile || callerProfile.role !== 'admin_global') {
          return new Response(JSON.stringify({ error: 'Permissão negada.' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // ─── CREATE GESTOR ───────────────────────────
    if (action === 'create_gestor') {
      const { email, password, fullName, plan, planStatus, aiCredits, lifetime } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split('@')[0],
          role: 'admin_gestor',
        },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newUser?.user?.id) {
        const updates: Record<string, unknown> = {
          plan: plan || 'starter',
          plan_status: planStatus || 'active',
          ai_credits_remaining: aiCredits ?? 50,
          full_name: fullName || email.split('@')[0],
        };
        if (lifetime) {
          updates.plan_expires_at = '2099-12-31T23:59:59Z';
        } else {
          updates.plan_expires_at = new Date(Date.now() + 30 * 86400000).toISOString();
        }
        await supabaseAdmin.from('profiles').update(updates).eq('id', newUser.user.id);
      }

      return new Response(JSON.stringify({ success: true, userId: newUser?.user?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── DELETE GESTOR ───────────────────────────
    if (action === 'delete_gestor') {
      const { gestorId } = body;
      if (!gestorId) {
        return new Response(JSON.stringify({ error: 'gestorId é obrigatório.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Delete auth user (cascade will clean up profiles and related data)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(gestorId);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── CREATE CLIENT (direct registration) ────
    if (action === 'create_client') {
      const { email, password, fullName, gestorId } = body;
      if (!email || !password || !gestorId) {
        return new Response(JSON.stringify({ error: 'Email, senha e gestorId são obrigatórios.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName || email.split('@')[0],
          role: 'usuario_cliente',
          gestor_id: gestorId,
        },
      });

      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (newUser?.user?.id) {
        await supabaseAdmin.from('profiles').update({ gestor_id: gestorId }).eq('id', newUser.user.id);
      }

      return new Response(JSON.stringify({ success: true, userId: newUser?.user?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ─── INVITE CLIENT (original) ────────────────
    const { email, gestorId } = body;
    if (!email || !gestorId) {
      return new Response(JSON.stringify({ error: 'Email e gestorId são obrigatórios.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name: email.split('@')[0],
        role: 'usuario_cliente',
        gestor_id: gestorId,
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (data?.user?.id) {
      await supabaseAdmin.from('profiles').update({ gestor_id: gestorId }).eq('id', data.user.id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('invite-client error:', e);
    return new Response(JSON.stringify({ error: 'Erro interno.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
