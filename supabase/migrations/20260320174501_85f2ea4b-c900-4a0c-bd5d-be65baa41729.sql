
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'admin_gestor'
    check (role in ('admin_global', 'admin_gestor', 'usuario_cliente')),
  gestor_id uuid references public.profiles(id) on delete set null,
  plan text default null
    check (plan in ('starter', 'pro', 'agency')),
  plan_status text default 'trial'
    check (plan_status in ('active', 'inactive', 'trial', 'cancelled')),
  plan_expires_at timestamptz,
  cakto_subscription_id text,
  white_label_logo_url text,
  white_label_brand_name text,
  ai_credits_remaining int default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.meta_accounts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.profiles(id) on delete cascade not null,
  gestor_id uuid references public.profiles(id) on delete cascade not null,
  ad_account_id text not null,
  account_name text,
  access_token_encrypted text not null,
  token_expires_at timestamptz,
  token_last_refreshed_at timestamptz,
  is_active boolean default true,
  currency text default 'BRL',
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(client_id, ad_account_id)
);

create table public.metrics_daily (
  id uuid default uuid_generate_v4() primary key,
  meta_account_id uuid references public.meta_accounts(id) on delete cascade,
  campaign_id text,
  adset_id text,
  ad_id text,
  date date not null,
  spend numeric default 0,
  impressions int default 0,
  clicks int default 0,
  reach int default 0,
  frequency numeric default 0,
  ctr numeric default 0,
  cpc numeric default 0,
  cpm numeric default 0,
  leads int default 0,
  purchases int default 0,
  revenue numeric default 0,
  roas numeric default 0,
  cpp numeric default 0,
  actions jsonb,
  created_at timestamptz default now(),
  unique(meta_account_id, campaign_id, adset_id, ad_id, date)
);

create table public.ai_analyses (
  id uuid default uuid_generate_v4() primary key,
  meta_account_id uuid references public.meta_accounts(id) on delete cascade,
  analysis_type text not null
    check (analysis_type in ('daily','weekly','monthly','alert','suggestion')),
  model_used text,
  tokens_used_input int,
  tokens_used_output int,
  cost_usd numeric,
  period_start date,
  period_end date,
  insights jsonb,
  summary_text text,
  created_at timestamptz default now()
);

create table public.alerts (
  id uuid default uuid_generate_v4() primary key,
  meta_account_id uuid references public.meta_accounts(id) on delete cascade,
  gestor_id uuid references public.profiles(id),
  client_id uuid references public.profiles(id),
  alert_type text not null
    check (alert_type in ('roas_drop','budget_ending','high_frequency','cpl_spike','campaign_error','token_expiring')),
  severity text default 'warning'
    check (severity in ('info','warning','critical')),
  title text not null,
  body text,
  is_read boolean default false,
  is_resolved boolean default false,
  metadata jsonb,
  created_at timestamptz default now()
);

create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  meta_account_id uuid references public.meta_accounts(id) on delete cascade,
  gestor_id uuid references public.profiles(id),
  client_id uuid references public.profiles(id),
  report_type text default 'weekly'
    check (report_type in ('weekly','monthly','custom')),
  period_start date,
  period_end date,
  title text,
  content_json jsonb,
  pdf_url text,
  white_label_applied boolean default false,
  status text default 'generating'
    check (status in ('generating','ready','error')),
  created_at timestamptz default now()
);

create table public.api_usage (
  id uuid default uuid_generate_v4() primary key,
  gestor_id uuid references public.profiles(id),
  month_year text not null,
  claude_calls int default 0,
  claude_tokens_input int default 0,
  claude_tokens_output int default 0,
  claude_cost_usd numeric default 0,
  meta_api_calls int default 0,
  updated_at timestamptz default now(),
  unique(gestor_id, month_year)
);

create table public.cakto_events (
  id uuid default uuid_generate_v4() primary key,
  event_type text,
  payload jsonb,
  processed boolean default false,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.meta_accounts enable row level security;
alter table public.metrics_daily enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.alerts enable row level security;
alter table public.reports enable row level security;
alter table public.api_usage enable row level security;
alter table public.cakto_events enable row level security;

create policy "profiles_own" on public.profiles for select using (
  auth.uid() = id
  or gestor_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_global')
);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);

create policy "meta_accounts_select" on public.meta_accounts for select using (
  gestor_id = auth.uid()
  or client_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_global')
);
create policy "meta_accounts_insert" on public.meta_accounts for insert with check (gestor_id = auth.uid());
create policy "meta_accounts_update" on public.meta_accounts for update using (gestor_id = auth.uid());
create policy "meta_accounts_delete" on public.meta_accounts for delete using (gestor_id = auth.uid());

create policy "metrics_access" on public.metrics_daily for select using (
  exists (
    select 1 from public.meta_accounts ma
    where ma.id = meta_account_id
    and (ma.gestor_id = auth.uid() or ma.client_id = auth.uid())
  )
);

create policy "ai_analyses_access" on public.ai_analyses for select using (
  exists (
    select 1 from public.meta_accounts ma
    where ma.id = meta_account_id
    and (ma.gestor_id = auth.uid() or ma.client_id = auth.uid())
  )
);

create policy "alerts_select" on public.alerts for select using (
  gestor_id = auth.uid() or client_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_global')
);
create policy "alerts_update" on public.alerts for update using (
  gestor_id = auth.uid() or client_id = auth.uid()
);

create policy "reports_select" on public.reports for select using (
  gestor_id = auth.uid() or client_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_global')
);

create policy "api_usage_access" on public.api_usage for select using (
  gestor_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_global')
);

create policy "cakto_events_admin_only" on public.cakto_events for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin_global')
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'admin_gestor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.check_account_limit(p_gestor_id uuid)
returns boolean as $$
declare
  v_plan text;
  v_count int;
  v_limit int;
begin
  select plan into v_plan from public.profiles where id = p_gestor_id;
  select count(*) into v_count from public.meta_accounts
    where gestor_id = p_gestor_id and is_active = true;
  v_limit := case v_plan
    when 'starter' then 3
    when 'pro' then 10
    when 'agency' then 999
    else 1
  end;
  return v_count < v_limit;
end;
$$ language plpgsql security definer;

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_meta_accounts_updated_at before update on public.meta_accounts for each row execute function public.update_updated_at_column();
create trigger update_api_usage_updated_at before update on public.api_usage for each row execute function public.update_updated_at_column();

create index idx_metrics_account_date on public.metrics_daily(meta_account_id, date desc);
create index idx_alerts_gestor on public.alerts(gestor_id, is_read, created_at desc);
create index idx_analyses_account on public.ai_analyses(meta_account_id, analysis_type, created_at desc);
create index idx_meta_accounts_gestor on public.meta_accounts(gestor_id, is_active);
