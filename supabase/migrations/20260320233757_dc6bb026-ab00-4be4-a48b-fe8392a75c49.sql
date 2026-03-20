
CREATE TABLE IF NOT EXISTS public.system_config (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO public.system_config (key, value) VALUES 
  ('system_message', ''),
  ('usd_brl_rate', '5.8')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "system_config_select" ON public.system_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "system_config_update" ON public.system_config
  FOR UPDATE TO authenticated
  USING (public.is_admin_global(auth.uid()));

CREATE POLICY "system_config_insert" ON public.system_config
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_global(auth.uid()));
