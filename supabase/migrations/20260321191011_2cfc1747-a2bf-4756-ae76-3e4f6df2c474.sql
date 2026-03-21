-- Allow gestors to delete their own reports
CREATE POLICY "reports_delete" ON public.reports
FOR DELETE USING (gestor_id = auth.uid());

-- Allow gestors/clients to delete their own alerts
CREATE POLICY "alerts_delete" ON public.alerts
FOR DELETE USING (gestor_id = auth.uid() OR client_id = auth.uid());

-- Allow gestors to insert alerts
CREATE POLICY "alerts_insert" ON public.alerts
FOR INSERT WITH CHECK (gestor_id = auth.uid());

-- Allow metrics_daily delete for gestors (via meta_accounts)
CREATE POLICY "metrics_delete" ON public.metrics_daily
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.meta_accounts ma
    WHERE ma.id = metrics_daily.meta_account_id
    AND ma.gestor_id = auth.uid()
  )
);