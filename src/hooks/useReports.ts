import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Report } from '@/types'
import { toast } from 'sonner'
import { generateReportHTML, type ReportData } from '@/lib/reportEngine'

export function useReports(metaAccountId?: string) {
  const { profile } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchReports()
  }, [metaAccountId, profile])

  async function fetchReports() {
    setLoading(true)
    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (metaAccountId) {
      query = query.eq('meta_account_id', metaAccountId)
    } else if (profile?.role === 'admin_gestor') {
      query = query.eq('gestor_id', profile.id)
    } else if (profile?.role === 'usuario_cliente') {
      query = query.eq('client_id', profile.id)
    }

    const { data } = await query
    setReports(
      (data || []).map(d => ({
        id: d.id,
        meta_account_id: d.meta_account_id || '',
        gestor_id: d.gestor_id || undefined,
        client_id: d.client_id || undefined,
        report_type: (d.report_type || 'weekly') as Report['report_type'],
        period_start: d.period_start || undefined,
        period_end: d.period_end || undefined,
        title: d.title || undefined,
        content_json: (d.content_json as Record<string, unknown>) || undefined,
        pdf_url: d.pdf_url || undefined,
        white_label_applied: d.white_label_applied ?? false,
        status: (d.status || 'generating') as Report['status'],
        created_at: d.created_at || '',
      }))
    )
    setLoading(false)
  }

  async function generateReport(
    metaAccountId: string,
    reportData: ReportData,
    reportType: 'weekly' | 'monthly' | 'custom' = 'weekly'
  ) {
    if (!profile) return null

    const { data: reportRecord, error } = await supabase
      .from('reports')
      .insert({
        meta_account_id: metaAccountId,
        gestor_id: profile.id,
        report_type: reportType,
        period_start: reportData.periodStart,
        period_end: reportData.periodEnd,
        title: `Relatório ${reportType === 'weekly' ? 'Semanal' : reportType === 'monthly' ? 'Mensal' : 'Personalizado'} — ${reportData.accountName}`,
        white_label_applied: !!reportData.agencyLogo || !!reportData.agencyName,
        status: 'generating',
      })
      .select()
      .single()

    if (error || !reportRecord) {
      toast.error('Erro ao criar relatório.')
      return null
    }

    try {
      // Generate narrative via edge function
      const { data: narrativeRes, error: fnError } = await supabase.functions.invoke('generate-report-narrative', {
        body: {
          reportData,
          gestorId: profile.id,
        },
      })

      const narrative = fnError ? '' : (narrativeRes?.narrative || '')

      // Generate HTML
      const html = generateReportHTML(reportData, narrative || 'Relatório gerado automaticamente.')

      // Update report with content
      await supabase
        .from('reports')
        .update({
          status: 'ready',
          content_json: {
            html,
            narrative,
            metrics: reportData.metrics,
            campaigns: reportData.campaigns,
            aiInsights: reportData.aiInsights,
          },
        })
        .eq('id', reportRecord.id)

      toast.success('Relatório gerado com sucesso!')
      await fetchReports()
      return reportRecord.id

    } catch (err: any) {
      await supabase
        .from('reports')
        .update({ status: 'error' })
        .eq('id', reportRecord.id)
      toast.error('Erro ao gerar relatório: ' + (err.message || 'Tente novamente.'))
      return null
    }
  }

  async function deleteReport(reportId: string) {
    // Reports table doesn't have DELETE policy, but we can update status
    toast.error('Funcionalidade em desenvolvimento.')
  }

  return { reports, loading, fetchReports, generateReport, deleteReport }
}
