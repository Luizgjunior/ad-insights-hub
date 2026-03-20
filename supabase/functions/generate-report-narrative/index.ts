import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportData, gestorId } = await req.json();

    if (!reportData || !gestorId) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios faltando.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Não autorizado.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check credits
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('ai_credits_remaining, plan, role')
      .eq('id', gestorId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Perfil não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.role !== 'admin_global' && profile.plan !== 'agency' && (profile.ai_credits_remaining ?? 0) <= 0) {
      return new Response(JSON.stringify({ error: 'Créditos de IA insuficientes.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
    const formatROAS = (v: number) => `${v.toFixed(1)}×`;
    const formatPct = (v: number) => `${v.toFixed(1)}%`;

    const prompt = `Escreva uma narrativa profissional para um relatório de campanhas Meta Ads.

AGÊNCIA: ${reportData.agencyName}
CLIENTE: ${reportData.accountName}
PERÍODO: ${reportData.period}

RESULTADOS:
- Investimento total: ${formatBRL(reportData.metrics?.spend || 0)}
- Leads gerados: ${reportData.metrics?.leads || 0}
- ROAS médio: ${formatROAS(reportData.metrics?.roas || 0)}
- CTR: ${formatPct(reportData.metrics?.ctr || 0)}
- Frequência: ${(reportData.metrics?.frequency || 0).toFixed(1)}

${reportData.previousMetrics ? `COMPARATIVO PERÍODO ANTERIOR:
- Investimento anterior: ${formatBRL(reportData.previousMetrics.spend)}
- Leads anterior: ${reportData.previousMetrics.leads}
- ROAS anterior: ${formatROAS(reportData.previousMetrics.roas)}` : ''}

SCORE DA CONTA: ${reportData.aiInsights?.score || 50}/100

Escreva 3 parágrafos em português brasileiro:
1. Resumo executivo dos resultados (linguagem de negócio, sem jargão técnico)
2. Destaques positivos e pontos de atenção
3. Próximos passos recomendados

Tom: profissional, direto, focado em resultados de negócio.
Máximo 250 palavras no total.`;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const model = 'google/gemini-2.5-flash';

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em marketing digital que escreve relatórios executivos claros e profissionais em português brasileiro.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.4,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', await aiResponse.text());
      return new Response(JSON.stringify({ narrative: '' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const narrative = aiData.choices?.[0]?.message?.content || '';
    const inputTokens = aiData.usage?.prompt_tokens || 0;
    const outputTokens = aiData.usage?.completion_tokens || 0;

    // Deduct credit
    if (profile.plan !== 'agency' && profile.role !== 'admin_global') {
      await supabaseAdmin
        .from('profiles')
        .update({ ai_credits_remaining: Math.max(0, (profile.ai_credits_remaining ?? 1) - 1) })
        .eq('id', gestorId);
    }

    // Track usage
    const monthYear = new Date().toISOString().slice(0, 7);
    await supabaseAdmin.from('api_usage').upsert(
      {
        gestor_id: gestorId,
        month_year: monthYear,
        claude_calls: 1,
        claude_tokens_input: inputTokens,
        claude_tokens_output: outputTokens,
        claude_cost_usd: 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'gestor_id,month_year', ignoreDuplicates: false }
    );

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ narrative: '' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
