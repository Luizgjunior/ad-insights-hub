import { supabase } from '@/integrations/supabase/client';

const META_BASE = 'https://graph.facebook.com/v20.0';

const ERROR_MAP: Record<string, string> = {
  'Invalid OAuth access token': 'Token inválido. Gere um novo no Meta for Developers.',
  'Error validating access token': 'Token expirado. Por favor, renove seu acesso.',
  'does not exist': 'Conta de anúncios não encontrada. Verifique o ID.',
};

function translateMetaError(message: string): string {
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.includes(key)) return value;
  }
  return message;
}

export async function validateMetaToken(token: string): Promise<{
  valid: boolean;
  userName?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${META_BASE}/me?fields=name&access_token=${token}`);
    const data = await res.json();
    if (data.error) return { valid: false, error: translateMetaError(data.error.message) };
    return { valid: true, userName: data.name };
  } catch {
    return { valid: false, error: 'Erro de conexão com a Meta.' };
  }
}

export async function getAdAccountInfo(accountId: string, token: string): Promise<{
  success: boolean;
  name?: string;
  currency?: string;
  status?: number;
  timezone?: string;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${META_BASE}/${accountId}?fields=name,currency,account_status,timezone_name&access_token=${token}`
    );
    const data = await res.json();
    if (data.error) return { success: false, error: translateMetaError(data.error.message) };
    return {
      success: true,
      name: data.name,
      currency: data.currency,
      status: data.account_status,
      timezone: data.timezone_name,
    };
  } catch {
    return { success: false, error: 'Erro de conexão com a Meta.' };
  }
}

export async function getCampaigns(accountId: string, token: string) {
  const res = await fetch(
    `${META_BASE}/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,budget_remaining&limit=50&access_token=${token}`
  );
  return res.json();
}

export async function getInsights(
  accountId: string,
  token: string,
  options: {
    datePreset?: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'this_month' | 'last_month';
    level?: 'account' | 'campaign' | 'adset' | 'ad';
    fields?: string;
  } = {}
) {
  const fields =
    options.fields ||
    'spend,impressions,clicks,reach,frequency,ctr,cpc,cpm,actions,action_values,cost_per_action_type';
  const level = options.level || 'account';
  const datePreset = options.datePreset || 'last_7d';
  const res = await fetch(
    `${META_BASE}/${accountId}/insights?fields=${fields}&date_preset=${datePreset}&level=${level}&access_token=${token}`
  );
  return res.json();
}

export function extractLeads(actions: any[]): number {
  if (!actions) return 0;
  const leadAction = actions.find(
    (a: any) =>
      a.action_type === 'lead' ||
      a.action_type === 'onsite_conversion.lead_grouped' ||
      a.action_type === 'offsite_conversion.fb_pixel_lead'
  );
  return leadAction ? parseInt(leadAction.value) : 0;
}

export function calculateROAS(actionValues: any[], spend: number): number {
  if (!actionValues || spend === 0) return 0;
  const purchaseValue = actionValues.find((a: any) => a.action_type === 'purchase');
  if (!purchaseValue) return 0;
  return parseFloat(purchaseValue.value) / spend;
}

export async function validateAndSaveMetaAccount(
  token: string,
  adAccountId: string,
  gestorId: string,
  clientId: string
): Promise<{ success: boolean; accountName?: string; error?: string }> {
  // 1. Validate token
  const tokenCheck = await validateMetaToken(token);
  if (!tokenCheck.valid) {
    return { success: false, error: tokenCheck.error || 'Token inválido. Verifique se copiou corretamente.' };
  }

  // 2. Validate ad account
  const accountCheck = await getAdAccountInfo(adAccountId, token);
  if (!accountCheck.success) {
    return { success: false, error: accountCheck.error || 'Conta de anúncios não encontrada.' };
  }
  if (accountCheck.status !== 1) {
    return { success: false, error: 'Esta conta de anúncios está inativa ou com restrições.' };
  }

  // 3. Check plan limit
  const { data: limitOk } = await supabase.rpc('check_account_limit', { p_gestor_id: gestorId });
  if (!limitOk) {
    return {
      success: false,
      error: 'Você atingiu o limite de contas do seu plano. Faça upgrade para adicionar mais.',
    };
  }

  // 4. Save to database
  const { error: dbError } = await supabase.from('meta_accounts').upsert(
    {
      client_id: clientId,
      gestor_id: gestorId,
      ad_account_id: adAccountId,
      account_name: accountCheck.name || null,
      access_token_encrypted: token,
      token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      token_last_refreshed_at: new Date().toISOString(),
      currency: accountCheck.currency || 'BRL',
      timezone: accountCheck.timezone || 'America/Sao_Paulo',
      is_active: true,
    },
    { onConflict: 'client_id,ad_account_id' }
  );

  if (dbError) return { success: false, error: 'Erro ao salvar. Tente novamente.' };

  return { success: true, accountName: accountCheck.name };
}

export async function syncMetrics(accountId: string, adAccountId: string, token: string) {
  try {
    const data = await getInsights(adAccountId, token, {
      datePreset: 'last_7d',
      level: 'campaign',
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,reach,frequency,ctr,cpc,cpm,actions,action_values,cost_per_action_type',
    });

    if (!data.data) return;

    for (const row of data.data) {
      const leads = extractLeads(row.actions);
      const roas = calculateROAS(row.action_values, parseFloat(row.spend || '0'));

      await supabase.from('metrics_daily').upsert(
        {
          meta_account_id: accountId,
          campaign_id: row.campaign_id,
          date: row.date_start,
          spend: parseFloat(row.spend || '0'),
          impressions: parseInt(row.impressions || '0'),
          clicks: parseInt(row.clicks || '0'),
          reach: parseInt(row.reach || '0'),
          frequency: parseFloat(row.frequency || '0'),
          ctr: parseFloat(row.ctr || '0'),
          cpc: parseFloat(row.cpc || '0'),
          cpm: parseFloat(row.cpm || '0'),
          leads,
          roas,
          revenue: roas * parseFloat(row.spend || '0'),
          actions: row.actions,
        },
        { onConflict: 'meta_account_id,campaign_id,adset_id,ad_id,date' }
      );
    }
  } catch (e) {
    console.error('Erro ao sincronizar métricas:', e);
  }
}
