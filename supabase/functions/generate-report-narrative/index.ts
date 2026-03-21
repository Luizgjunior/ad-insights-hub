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

    const trendSpend = reportData.previousMetrics?.spend
      ? (((reportData.metrics.spend - reportData.previousMetrics.spend) / reportData.previousMetrics.spend) * 100).toFixed(1)
      : null;
    const trendLeads = reportData.previousMetrics?.leads
      ? (((reportData.metrics.leads - reportData.previousMetrics.leads) / reportData.previousMetrics.leads) * 100).toFixed(1)
      : null;
    const trendRoas = reportData.previousMetrics?.roas
      ? (((reportData.metrics.roas - reportData.previousMetrics.roas) / reportData.previousMetrics.roas) * 100).toFixed(1)
      : null;

    const cpl = reportData.metrics.leads > 0
      ? formatBRL(reportData.metrics.spend / reportData.metrics.leads)
      : 'Não disponível';

    const scoreContext =
      (reportData.aiInsights?.score || 0) >= 80 ? 'excelente' :
      (reportData.aiInsights?.score || 0) >= 60 ? 'satisfatório' :
      (reportData.aiInsights?.score || 0) >= 40 ? 'com pontos de atenção' :
      'crítico e exige revisão urgente';

    const prompt = `Escreva a análise executiva de um relatório de campanhas Meta Ads.

DADOS DO RELATÓRIO:
Agência:       ${reportData.agencyName || 'MetaFlux'}
Cliente:       ${reportData.accountName}
Período:       ${reportData.period}
Score IA:      ${reportData.aiInsights?.score || 0}/100 — desempenho ${scoreContext}

RESULTADOS DO PERÍODO:
Investimento:        ${formatBRL(reportData.metrics?.spend || 0)}
Leads gerados:       ${reportData.metrics?.leads || 0}
Custo por lead:      ${cpl}
Retorno (ROAS):      ${formatROAS(reportData.metrics?.roas || 0)}
Taxa de cliques:     ${formatPct(reportData.metrics?.ctr || 0)}
Frequência média:    ${(reportData.metrics?.frequency || 0).toFixed(1)}
Impressões:          ${(reportData.metrics?.impressions || 0).toLocaleString('pt-BR')}

${reportData.previousMetrics ? `COMPARATIVO COM PERÍODO ANTERIOR:
Investimento:  ${formatBRL(reportData.previousMetrics.spend)} ${trendSpend ? `(${parseFloat(trendSpend) >= 0 ? '+' : ''}${trendSpend}%)` : ''}
Leads:         ${reportData.previousMetrics.leads} ${trendLeads ? `(${parseFloat(trendLeads) >= 0 ? '+' : ''}${trendLeads}%)` : ''}
ROAS:          ${formatROAS(reportData.previousMetrics.roas)} ${trendRoas ? `(${parseFloat(trendRoas) >= 0 ? '+' : ''}${trendRoas}%)` : ''}` : 'Sem dados de período anterior para comparação.'}

PRINCIPAIS INSIGHTS DA IA:
${(reportData.aiInsights?.insights || []).map((i: string, idx: number) => `${idx + 1}. ${i}`).join('\n') || 'Não disponíveis.'}

RECOMENDAÇÕES PRIORIZADAS:
${(reportData.aiInsights?.suggestions || []).map((s: string, idx: number) => `${idx + 1}. ${s}`).join('\n') || 'Não disponíveis.'}

Escreva exatamente 3 parágrafos, sem títulos, sem listas, sem markdown:

Parágrafo 1 — Resumo executivo: apresente o resultado geral do período de forma clara, citando
os números mais relevantes em linguagem de negócio. Se houve melhora, celebre. Se houve queda, seja honesto.

Parágrafo 2 — Análise detalhada: aprofunde nos principais pontos — o que funcionou, o que não funcionou,
o que o score de ${reportData.aiInsights?.score || 0}/100 representa na prática para o negócio do cliente.
Mencione ao menos um dado específico (custo por lead, ROAS de uma campanha, frequência, etc.).

Parágrafo 3 — Próximos passos: cite 2-3 ações concretas que serão tomadas no próximo período
com base nos insights da IA. Seja específico e inspirador — o cliente deve sentir que está em boas mãos.

Máximo 280 palavras. Tom: profissional, confiante, sem jargão técnico.`;

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
            content: `Você é um redator especialista em marketing digital brasileiro.
Escreve relatórios executivos para gestores de tráfego entregarem a seus clientes.
Seu tom é: profissional, otimista quando os resultados permitem, honesto quando há problemas,
e sempre orientado a próximos passos concretos.
Nunca use siglas sem explicar (CTR, ROAS, CPL devem ser traduzidos ou contextualizados).
Escreva sempre em português brasileiro formal, sem gírias.`,
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 700,
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
