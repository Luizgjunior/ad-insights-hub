export type UserRole = 'admin_global' | 'admin_gestor' | 'usuario_cliente'
export type Plan = 'starter' | 'pro' | 'agency'
export type PlanStatus = 'active' | 'inactive' | 'trial' | 'cancelled'
export type AlertSeverity = 'info' | 'warning' | 'critical'
export type AlertType = 'roas_drop' | 'budget_ending' | 'high_frequency' | 'cpl_spike' | 'campaign_error' | 'token_expiring'

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: UserRole
  gestor_id?: string
  plan?: Plan
  plan_status: PlanStatus
  plan_expires_at?: string
  cakto_subscription_id?: string
  white_label_brand_name?: string
  white_label_logo_url?: string
  ai_credits_remaining: number
  created_at: string
}

export interface MetaAccount {
  id: string
  client_id: string
  gestor_id: string
  ad_account_id: string
  account_name: string
  token_expires_at?: string
  token_last_refreshed_at?: string
  is_active: boolean
  currency: string
  timezone: string
  created_at: string
}

export interface MetricsDaily {
  id: string
  meta_account_id: string
  campaign_id?: string
  date: string
  spend: number
  impressions: number
  clicks: number
  reach: number
  frequency: number
  ctr: number
  cpc: number
  cpm: number
  leads: number
  purchases: number
  revenue: number
  roas: number
  cpp: number
}

export interface AiAnalysis {
  id: string
  meta_account_id: string
  analysis_type: 'daily' | 'weekly' | 'monthly' | 'alert' | 'suggestion'
  model_used?: string
  period_start?: string
  period_end?: string
  insights?: {
    score: number
    insights: string[]
    suggestions: string[]
    alerts: string[]
  }
  summary_text?: string
  cost_usd?: number
  created_at: string
}

export interface Alert {
  id: string
  meta_account_id: string
  gestor_id?: string
  client_id?: string
  alert_type: AlertType
  severity: AlertSeverity
  title: string
  body?: string
  is_read: boolean
  is_resolved: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Report {
  id: string
  meta_account_id: string
  gestor_id?: string
  client_id?: string
  report_type: 'weekly' | 'monthly' | 'custom'
  period_start?: string
  period_end?: string
  title?: string
  content_json?: Record<string, unknown>
  pdf_url?: string
  white_label_applied: boolean
  status: 'generating' | 'ready' | 'error'
  created_at: string
}

export interface PlanConfig {
  name: string
  price: number
  maxAccounts: number
  reportFrequency: 'weekly' | 'daily' | 'realtime'
  aiMode: 'alerts' | 'autopilot' | 'full'
  whiteLabel: boolean
}

export const PLAN_CONFIGS: Record<Plan, PlanConfig> = {
  starter: {
    name: 'Starter',
    price: 97,
    maxAccounts: 3,
    reportFrequency: 'weekly',
    aiMode: 'alerts',
    whiteLabel: false,
  },
  pro: {
    name: 'Pro',
    price: 197,
    maxAccounts: 10,
    reportFrequency: 'daily',
    aiMode: 'autopilot',
    whiteLabel: true,
  },
  agency: {
    name: 'Agency',
    price: 397,
    maxAccounts: 999,
    reportFrequency: 'realtime',
    aiMode: 'full',
    whiteLabel: true,
  },
}
