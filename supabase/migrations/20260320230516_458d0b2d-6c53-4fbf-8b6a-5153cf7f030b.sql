
-- Create a SECURITY DEFINER function to check admin role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin_global(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = 'admin_global'
  )
$$;

-- Drop and recreate profiles_own policy using the function
DROP POLICY IF EXISTS "profiles_own" ON public.profiles;
CREATE POLICY "profiles_own" ON public.profiles FOR SELECT USING (
  auth.uid() = id
  OR gestor_id = auth.uid()
  OR public.is_admin_global(auth.uid())
);

-- Fix alerts_select policy
DROP POLICY IF EXISTS "alerts_select" ON public.alerts;
CREATE POLICY "alerts_select" ON public.alerts FOR SELECT USING (
  gestor_id = auth.uid()
  OR client_id = auth.uid()
  OR public.is_admin_global(auth.uid())
);

-- Fix meta_accounts_select policy
DROP POLICY IF EXISTS "meta_accounts_select" ON public.meta_accounts;
CREATE POLICY "meta_accounts_select" ON public.meta_accounts FOR SELECT USING (
  gestor_id = auth.uid()
  OR client_id = auth.uid()
  OR public.is_admin_global(auth.uid())
);

-- Fix reports_select policy
DROP POLICY IF EXISTS "reports_select" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  gestor_id = auth.uid()
  OR client_id = auth.uid()
  OR public.is_admin_global(auth.uid())
);

-- Fix api_usage_access policy
DROP POLICY IF EXISTS "api_usage_access" ON public.api_usage;
CREATE POLICY "api_usage_access" ON public.api_usage FOR SELECT USING (
  gestor_id = auth.uid()
  OR public.is_admin_global(auth.uid())
);

-- Fix cakto_events_admin_only policy
DROP POLICY IF EXISTS "cakto_events_admin_only" ON public.cakto_events;
CREATE POLICY "cakto_events_admin_only" ON public.cakto_events FOR SELECT USING (
  public.is_admin_global(auth.uid())
);
