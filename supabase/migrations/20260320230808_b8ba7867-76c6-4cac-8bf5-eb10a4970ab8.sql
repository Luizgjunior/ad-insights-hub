
-- Add INSERT and UPDATE policies for reports table
CREATE POLICY "reports_insert" ON public.reports FOR INSERT
WITH CHECK (gestor_id = auth.uid());

CREATE POLICY "reports_update" ON public.reports FOR UPDATE
USING (gestor_id = auth.uid());
