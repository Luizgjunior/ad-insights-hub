import { formatCurrency, formatROAS, formatPercent } from './utils'
import type { AccountMetricsInput } from '@/hooks/useAiAnalysis'

export interface ReportData {
  title: string
  period: string
  agencyName: string
  agencyLogo?: string
  accountName: string
  adAccountId: string
  generatedAt: string
  metrics: {
    spend: number
    leads: number
    roas: number
    ctr: number
    cpc: number
    cpm: number
    frequency: number
    impressions: number
    clicks: number
    cpp: number
  }
  previousMetrics?: {
    spend: number
    leads: number
    roas: number
  }
  campaigns: {
    name: string
    status: string
    spend: number
    leads: number
    roas: number
    ctr: number
    frequency: number
  }[]
  aiInsights: {
    score: number
    insights: string[]
    suggestions: string[]
    alerts: string[]
    summaryText: string
  }
  periodStart: string
  periodEnd: string
}

// Gera HTML do relatório (será convertido para PDF via print)
export function generateReportHTML(data: ReportData, narrative: string): string {
  const logoHtml = data.agencyLogo
    ? `<img src="${data.agencyLogo}" alt="${data.agencyName}" class="agency-logo" />`
    : `<div class="agency-name-text">${data.agencyName}</div>`

  const trendSpend = data.previousMetrics
    ? ((data.metrics.spend - data.previousMetrics.spend) / data.previousMetrics.spend * 100)
    : null
  const trendLeads = data.previousMetrics
    ? ((data.metrics.leads - data.previousMetrics.leads) / data.previousMetrics.leads * 100)
    : null
  const trendRoas = data.previousMetrics
    ? ((data.metrics.roas - data.previousMetrics.roas) / data.previousMetrics.roas * 100)
    : null

  const trendHtml = (value: number | null) => {
    if (value === null) return ''
    const color = value >= 0 ? '#00C48C' : '#FF4757'
    const arrow = value >= 0 ? '↑' : '↓'
    return `<span class="trend" style="color:${color}">${arrow} ${Math.abs(value).toFixed(1)}% vs período anterior</span>`
  }

  const scoreColor = data.aiInsights.score >= 80
    ? '#00C48C'
    : data.aiInsights.score >= 50
    ? '#FFB800'
    : '#FF4757'

  const scoreLabel = data.aiInsights.score >= 80
    ? 'Excelente'
    : data.aiInsights.score >= 50
    ? 'Atenção'
    : 'Crítico'

  const campaignsRows = data.campaigns.map(c => `
    <tr>
      <td>${c.name}</td>
      <td><span class="status-badge status-${c.status.toLowerCase()}">${c.status}</span></td>
      <td>${formatCurrency(c.spend)}</td>
      <td>${c.leads}</td>
      <td>${formatROAS(c.roas)}</td>
      <td>${formatPercent(c.ctr)}</td>
      <td>${c.frequency.toFixed(1)}</td>
    </tr>
  `).join('')

  const insightsList = data.aiInsights.insights
    .map(i => `<li>${i}</li>`).join('')
  const suggestionsList = data.aiInsights.suggestions
    .map(s => `<li>${s}</li>`).join('')
  const alertsList = data.aiInsights.alerts.length > 0
    ? data.aiInsights.alerts.map(a => `<li>${a}</li>`).join('')
    : '<li>Nenhum alerta crítico no período.</li>'

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a2e;
    background: #fff;
    font-size: 13px;
    line-height: 1.6;
  }
  .page { max-width: 794px; margin: 0 auto; padding: 40px; }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 24px;
    border-bottom: 3px solid #1877F2;
    margin-bottom: 32px;
  }
  .agency-logo { height: 48px; max-width: 180px; object-fit: contain; }
  .agency-name-text {
    font-size: 22px;
    font-weight: 700;
    color: #1877F2;
    letter-spacing: -0.5px;
  }
  .report-meta { text-align: right; }
  .report-meta h1 {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 4px;
  }
  .report-meta p { color: #666; font-size: 12px; }
  .score-banner {
    background: linear-gradient(135deg, #f8faff 0%, #eef3ff 100%);
    border: 1px solid #dde8ff;
    border-radius: 12px;
    padding: 20px 24px;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 24px;
  }
  .score-circle {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 3px solid;
    flex-shrink: 0;
  }
  .score-number { font-size: 22px; font-weight: 700; }
  .score-text { font-size: 10px; font-weight: 500; }
  .score-narrative { flex: 1; font-size: 13px; color: #444; line-height: 1.6; }
  .score-narrative strong { color: #1a1a2e; }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 14px;
    padding-bottom: 6px;
    border-bottom: 1px solid #eee;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .metric-card {
    background: #f8faff;
    border: 1px solid #e8eeff;
    border-radius: 8px;
    padding: 14px;
  }
  .metric-label {
    font-size: 10px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 6px;
  }
  .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 3px;
  }
  .trend { font-size: 10px; font-weight: 600; }
  .table-wrap { margin-bottom: 28px; overflow: hidden; border-radius: 8px; border: 1px solid #eee; }
  table { width: 100%; border-collapse: collapse; }
  thead { background: #1877F2; color: white; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 600; }
  tbody tr:nth-child(even) { background: #f8faff; }
  tbody td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #f0f0f0; }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
  }
  .status-active { background: #e6f9f3; color: #00875A; }
  .status-paused { background: #f0f0f0; color: #666; }
  .status-archived { background: #fff0f0; color: #cc4444; }
  .insights-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 28px;
  }
  .insight-box {
    background: #f8faff;
    border: 1px solid #e8eeff;
    border-radius: 8px;
    padding: 16px;
  }
  .insight-box.alerts { background: #fff8f0; border-color: #ffe4cc; }
  .insight-box h4 {
    font-size: 11px;
    font-weight: 700;
    color: #1877F2;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 10px;
  }
  .insight-box.alerts h4 { color: #e67700; }
  .insight-box ul { padding-left: 16px; }
  .insight-box li { font-size: 12px; color: #444; margin-bottom: 6px; line-height: 1.4; }
  .narrative {
    background: #f8faff;
    border-left: 4px solid #1877F2;
    padding: 20px 24px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 28px;
  }
  .narrative p { font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.7; }
  .narrative p:last-child { margin-bottom: 0; }
  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer p { font-size: 10px; color: #aaa; }
  .powered { font-size: 10px; color: #ccc; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 20px; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="agency-brand">${logoHtml}</div>
    <div class="report-meta">
      <h1>Relatório de Performance</h1>
      <p>${data.accountName}</p>
      <p>${data.period}</p>
      <p>Gerado em ${data.generatedAt}</p>
    </div>
  </div>
  <div class="score-banner">
    <div class="score-circle" style="border-color:${scoreColor}">
      <span class="score-number" style="color:${scoreColor}">${data.aiInsights.score}</span>
      <span class="score-text" style="color:${scoreColor}">${scoreLabel}</span>
    </div>
    <div class="score-narrative">
      <strong>Resumo do período:</strong><br/>
      ${data.aiInsights.summaryText}
    </div>
  </div>
  <div class="section-title">Métricas do Período</div>
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-label">Investimento</div>
      <div class="metric-value">${formatCurrency(data.metrics.spend)}</div>
      ${trendHtml(trendSpend)}
    </div>
    <div class="metric-card">
      <div class="metric-label">Leads Gerados</div>
      <div class="metric-value">${data.metrics.leads}</div>
      ${trendHtml(trendLeads)}
    </div>
    <div class="metric-card">
      <div class="metric-label">ROAS</div>
      <div class="metric-value">${formatROAS(data.metrics.roas)}</div>
      ${trendHtml(trendRoas)}
    </div>
    <div class="metric-card">
      <div class="metric-label">Custo por Lead</div>
      <div class="metric-value">${data.metrics.leads > 0 ? formatCurrency(data.metrics.spend / data.metrics.leads) : 'N/A'}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Impressões</div>
      <div class="metric-value">${data.metrics.impressions.toLocaleString('pt-BR')}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Cliques</div>
      <div class="metric-value">${data.metrics.clicks.toLocaleString('pt-BR')}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">CTR</div>
      <div class="metric-value">${formatPercent(data.metrics.ctr)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Frequência</div>
      <div class="metric-value">${data.metrics.frequency.toFixed(1)}</div>
    </div>
  </div>
  ${data.campaigns.length > 0 ? `
  <div class="section-title">Campanhas do Período</div>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Campanha</th>
          <th>Status</th>
          <th>Investimento</th>
          <th>Leads</th>
          <th>ROAS</th>
          <th>CTR</th>
          <th>Freq.</th>
        </tr>
      </thead>
      <tbody>${campaignsRows}</tbody>
    </table>
  </div>` : ''}
  <div class="section-title">Análise de Inteligência Artificial</div>
  <div class="insights-grid">
    <div class="insight-box">
      <h4>📊 Insights</h4>
      <ul>${insightsList}</ul>
    </div>
    <div class="insight-box">
      <h4>💡 Recomendações</h4>
      <ul>${suggestionsList}</ul>
    </div>
    <div class="insight-box alerts">
      <h4>⚠️ Pontos de Atenção</h4>
      <ul>${alertsList}</ul>
    </div>
  </div>
  <div class="section-title">Análise Executiva</div>
  <div class="narrative">
    ${narrative.split('\n\n').map(p => `<p>${p}</p>`).join('')}
  </div>
  <div class="footer">
    <p>${data.agencyName} · Relatório gerado em ${data.generatedAt}</p>
    <p class="powered">Powered by MetaFlux</p>
  </div>
</div>
</body>
</html>`
}
