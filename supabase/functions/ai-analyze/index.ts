import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE_SYSTEM_PROMPT = `Você é o MetaFlux AI — um especialista sênior em tráfego pago no Meta Ads
com mais de 8 anos de experiência no mercado brasileiro.

Você analisa dados de campanhas Meta Ads e entrega insights práticos, diretos e acionáveis.
Você conhece profundamente as particularidades do consumidor brasileiro, sazonalidades nacionais
(Black Friday, Dia das Mães, Natal, Carnaval, Semana do Brasil) e os nichos mais comuns no digital BR.

═══════════════════════════════════════════════════
BENCHMARKS DO MERCADO BRASILEIRO — sua régua de análise
═══════════════════════════════════════════════════

ROAS (Retorno sobre investimento em anúncios):
  E-commerce físico:    bom >= 3.0×  |  ótimo >= 5.0×  |  crítico < 1.5×
  Infoproduto/curso:    bom >= 4.0×  |  ótimo >= 7.0×  |  crítico < 2.0×
  Serviço local:        bom >= 2.0×  |  ótimo >= 3.5×  |  crítico < 1.2×
  Suplemento/saúde:     bom >= 2.5×  |  ótimo >= 4.0×  |  crítico < 1.5×
  Geração de leads:     não se aplica diretamente — analisar CPL

CTR (Taxa de cliques):
  Feed de notícias:     bom >= 1.5%  |  ótimo >= 3.0%  |  crítico < 0.8%
  Stories/Reels:        bom >= 0.8%  |  ótimo >= 1.5%  |  crítico < 0.4%
  Anúncio de vídeo:     bom >= 1.2%  |  ótimo >= 2.5%  |  crítico < 0.6%

CPC (Custo por clique):
  Lead frio (topo):     bom <= R$ 2,50  |  crítico > R$ 5,00
  Remarketing:          bom <= R$ 1,50  |  crítico > R$ 3,50
  E-commerce:           bom <= R$ 1,80  |  crítico > R$ 4,00

CPL (Custo por lead — geração de contatos):
  WhatsApp lead:        bom <= R$ 15  |  ótimo <= R$ 8   |  crítico > R$ 35
  Formulário nativo:    bom <= R$ 20  |  ótimo <= R$ 10  |  crítico > R$ 50
  Landing page:         bom <= R$ 30  |  ótimo <= R$ 15  |  crítico > R$ 70

FREQUÊNCIA (vezes que o mesmo usuário vê o anúncio):
  Ideal: 1.5 a 3.0
  Atenção: 3.1 a 4.0 — monitorar engajamento e CPL
  Fadiga criativa: > 4.0 — renovar criativos com urgência
  Crítico: > 5.5 — público saturado, expandir audiência

CPM (Custo por mil impressões):
  Feed BR:     bom <= R$ 18  |  crítico > R$ 40
  Stories BR:  bom <= R$ 12  |  crítico > R$ 30

═══════════════════════════════════════════════════
SCORE DE SAÚDE DA CONTA (0-100)
═══════════════════════════════════════════════════

Calcule o score assim:
  ROAS >= benchmark "bom" do nicho:      +25 pts
  ROAS >= benchmark "ótimo" do nicho:    +10 pts extras
  CTR >= benchmark "bom":                +20 pts
  Frequência entre 1.5 e 3.0:           +20 pts
  Frequência entre 3.1 e 4.0:           +10 pts (parcial)
  CPL dentro do benchmark "bom":         +15 pts
  Gasto > 0 (conta ativa):              +10 pts
  Sem variação negativa > 20% vs anterior: +0 pts extras (manter)
  Queda > 20% em qualquer KPI principal: -15 pts

80-100: Excelente — manter estratégia, escalar budget
60-79:  Bom — pequenos ajustes, monitorar
40-59:  Atenção — intervenção necessária em 48h
0-39:   Crítico — revisão urgente da estratégia

═══════════════════════════════════════════════════
REGRAS DE RESPOSTA — OBRIGATÓRIAS
═══════════════════════════════════════════════════

1. Retorne APENAS JSON válido. Nenhum texto antes ou depois. Sem markdown.
2. Seja específico: cite valores reais dos dados recebidos nos insights.
3. Insights descrevem O QUE está acontecendo (com números).
4. Sugestões descrevem O QUE FAZER (ação concreta, não genérica).
   Ruim:  "Otimize seus criativos"
   Bom:   "O criativo com CTR 0,4% está puxando o CPC para R$ 4,80 — pause-o e duplique o orçamento do criativo com CTR 2,1%"
5. Alertas são situações que exigem ação IMEDIATA (frequência crítica, token expirando, gasto sem conversão).
6. summaryText é para o CLIENTE FINAL — use linguagem de negócio, sem siglas.
   Troque: "CTR de 2,1% com CPL de R$ 12" por "cada contato gerado custou R$ 12 e seus anúncios foram clicados por 1 em cada 50 pessoas que viram"
7. Máximo: 3 insights, 3 sugestões, 3 alertas. Qualidade > quantidade.
8. Se os dados forem insuficientes (spend=0, metrics zerados), retorne score=0 e insights explicando.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metrics, analysisType, gestorId, metaAccountId } = await req.json();

    if (!metrics || !analysisType || !gestorId || !metaAccountId) {
      return new Response(JSON.stringify({ error: 'Parâmetros obrigatórios faltando.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
      return new Response(JSON.stringify({ error: 'Créditos de IA insuficientes. Faça upgrade do seu plano.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const limits: Record<string, number> = { starter: 1, pro: 3, agency: 999 };
    const dailyLimit = limits[profile.plan || ''] || 1;

    const { count } = await supabaseAdmin
      .from('ai_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('meta_account_id', metaAccountId)
      .eq('analysis_type', analysisType)
      .gte('created_at', `${today}T00:00:00`);

    if ((count ?? 0) >= dailyLimit) {
      return new Response(JSON.stringify({ error: 'Limite diário de análises atingido. Disponível amanhã.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build prompt
    const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
    const formatROAS = (v: number) => `${v.toFixed(1)}×`;
    const formatPct = (v: number) => `${v.toFixed(1)}%`;

    let prompt: string;
    if (analysisType === 'daily') {
      prompt = `Analise os dados de hoje da conta Meta Ads abaixo e retorne um JSON.

CONTA: ${metrics.accountName} (${metrics.adAccountId})
PERÍODO: ${metrics.period || 'Hoje'}

MÉTRICAS ATUAIS:
- Gasto: ${formatBRL(metrics.spend || 0)}
- Leads: ${metrics.leads || 0}
- ROAS: ${formatROAS(metrics.roas || 0)}
- CTR: ${formatPct(metrics.ctr || 0)}
- CPC: ${formatBRL(metrics.cpc || 0)}
- Frequência: ${(metrics.frequency || 0).toFixed(1)}
- Impressões: ${(metrics.impressions || 0).toLocaleString('pt-BR')}

COMPARATIVO COM PERÍODO ANTERIOR:
- Gasto anterior: ${metrics.previousSpend ? formatBRL(metrics.previousSpend) : 'N/A'}
- ROAS anterior: ${metrics.previousRoas ? formatROAS(metrics.previousRoas) : 'N/A'}
- Leads anterior: ${metrics.previousLeads ?? 'N/A'}

Retorne EXATAMENTE este JSON:
{
  "score": <número 0-100>,
  "insights": ["insight 1", "insight 2", "insight 3"],
  "suggestions": ["sugestão 1", "sugestão 2", "sugestão 3"],
  "alerts": ["alerta 1 se houver"],
  "summaryText": "Resumo de 2 frases em linguagem simples para o cliente final."
}`;
    } else {
      const campaignsText = metrics.campaigns?.length
        ? metrics.campaigns.map((c: any) =>
            `  - ${c.name}: Gasto ${formatBRL(c.spend)}, Leads ${c.leads}, ROAS ${formatROAS(c.roas)}, CTR ${formatPct(c.ctr)}, Freq ${(c.frequency || 0).toFixed(1)}, Status: ${c.status}`
          ).join('\n')
        : '  Dados de campanha não disponíveis';

      prompt = `Faça uma análise semanal completa da conta Meta Ads abaixo.

CONTA: ${metrics.accountName} (${metrics.adAccountId})
PERÍODO: últimos 7 dias

MÉTRICAS CONSOLIDADAS:
- Gasto total: ${formatBRL(metrics.spend || 0)}
- Leads: ${metrics.leads || 0}
- ROAS médio: ${formatROAS(metrics.roas || 0)}
- CTR médio: ${formatPct(metrics.ctr || 0)}
- CPC médio: ${formatBRL(metrics.cpc || 0)}
- CPM: ${formatBRL(metrics.cpm || 0)}
- Frequência média: ${(metrics.frequency || 0).toFixed(1)}
- Impressões: ${(metrics.impressions || 0).toLocaleString('pt-BR')}
- Cliques: ${(metrics.clicks || 0).toLocaleString('pt-BR')}

CAMPANHAS:
${campaignsText}

Retorne EXATAMENTE este JSON:
{
  "score": <número 0-100>,
  "insights": ["insight detalhado 1", "insight detalhado 2", "insight detalhado 3"],
  "suggestions": ["sugestão acionável 1", "sugestão acionável 2", "sugestão acionável 3"],
  "alerts": ["alerta crítico se houver"],
  "summaryText": "Resumo de 3 frases em linguagem simples para o cliente."
}`;
    }

    // Call Lovable AI
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const model = analysisType === 'daily' ? 'google/gemini-2.5-flash' : 'google/gemini-2.5-pro';

    const aiResponse = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: BASE_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: analysisType === 'daily' ? 800 : 1200,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI API error:', errText);
      return new Response(JSON.stringify({ error: 'Análise temporariamente indisponível. Tente em alguns minutos.' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';
    const inputTokens = aiData.usage?.prompt_tokens || 0;
    const outputTokens = aiData.usage?.completion_tokens || 0;

    // Parse AI response
    let parsed;
    try {
      const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      parsed = {
        score: 50,
        insights: ['Não foi possível processar a análise. Tente novamente.'],
        suggestions: [],
        alerts: [],
        summaryText: 'Análise em processamento.',
      };
    }

    const result = {
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 50)),
      insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 3) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts.slice(0, 3) : [],
      summaryText: parsed.summaryText || '',
      modelUsed: model,
      inputTokens,
      outputTokens,
    };

    // Save to ai_analyses
    const periodEnd = today;
    const periodStart = analysisType === 'weekly'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : today;

    await supabaseAdmin.from('ai_analyses').insert({
      meta_account_id: metaAccountId,
      analysis_type: analysisType,
      model_used: model,
      tokens_used_input: inputTokens,
      tokens_used_output: outputTokens,
      cost_usd: 0,
      period_start: periodStart,
      period_end: periodEnd,
      insights: {
        score: result.score,
        insights: result.insights,
        suggestions: result.suggestions,
        alerts: result.alerts,
      },
      summary_text: result.summaryText,
    });

    // Deduct credit
    if (profile.plan !== 'agency' && profile.role !== 'admin_global') {
      await supabaseAdmin
        .from('profiles')
        .update({ ai_credits_remaining: Math.max(0, (profile.ai_credits_remaining ?? 1) - 1) })
        .eq('id', gestorId);
    }

    // Track API usage
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

    // Detect rule-based alerts
    await detectRuleAlerts(supabaseAdmin, metrics, gestorId, metrics.clientId, metaAccountId);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Edge function error:', e);
    return new Response(JSON.stringify({ error: 'Análise temporariamente indisponível. Tente em alguns minutos.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function detectRuleAlerts(
  supabase: any,
  metrics: any,
  gestorId: string,
  clientId: string | undefined,
  metaAccountId: string
) {
  const alerts: any[] = [];

  if (metrics.roas > 0 && metrics.previousRoas && metrics.previousRoas > 0) {
    const roasDrop = ((metrics.previousRoas - metrics.roas) / metrics.previousRoas) * 100;
    if (roasDrop >= 30) {
      alerts.push({
        alert_type: 'roas_drop',
        severity: roasDrop >= 50 ? 'critical' : 'warning',
        title: `ROAS caiu ${roasDrop.toFixed(0)}% em ${metrics.accountName}`,
        body: `ROAS foi de ${metrics.previousRoas.toFixed(1)}× para ${metrics.roas.toFixed(1)}×. Verifique criativos e segmentação.`,
      });
    }
  }

  if ((metrics.frequency || 0) >= 4.0) {
    alerts.push({
      alert_type: 'high_frequency',
      severity: metrics.frequency >= 5.0 ? 'critical' : 'warning',
      title: `Frequência alta em ${metrics.accountName}`,
      body: `Frequência de ${metrics.frequency.toFixed(1)} indica possível fadiga criativa.`,
    });
  }

  if ((metrics.spend || 0) > 0 && (metrics.leads || 0) === 0) {
    alerts.push({
      alert_type: 'cpl_spike',
      severity: 'warning',
      title: `Sem leads em ${metrics.accountName}`,
      body: `R$ ${metrics.spend.toFixed(2)} investidos sem nenhum lead gerado.`,
    });
  }

  for (const alert of alerts) {
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('meta_account_id', metaAccountId)
      .eq('alert_type', alert.alert_type)
      .eq('is_resolved', false)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (!existing) {
      await supabase.from('alerts').insert({
        meta_account_id: metaAccountId,
        gestor_id: gestorId,
        client_id: clientId || null,
        ...alert,
        metadata: { metrics },
      });
    }
  }
}
