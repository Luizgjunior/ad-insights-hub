import { Sparkles, ChevronRight } from 'lucide-react'
import type { AiAnalysis } from '@/types'

interface AiInsightCardProps {
  analysis?: AiAnalysis
  compact?: boolean
  loading?: boolean
}

export default function AiInsightCard({ analysis, compact, loading }: AiInsightCardProps) {
  if (loading) {
    return (
      <div className="ai-card p-4 space-y-3">
        <div className="skeleton h-3 w-32 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
      </div>
    )
  }

  const score = analysis?.insights?.score ?? 0
  const scoreColor = score >= 80 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--danger)'

  if (compact) {
    return (
      <div className="ai-card p-4">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Sparkles size={14} className="icon-sparkle" />
          <span className="section-title">Análise IA</span>
          {score > 0 && (
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              fontWeight: 500,
              color: scoreColor,
            }}>
              {score}/100
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {analysis?.summary_text ?? 'Análise em processamento...'}
        </p>
      </div>
    )
  }

  const insights     = analysis?.insights?.insights ?? []
  const suggestions  = analysis?.insights?.suggestions ?? []
  const alerts       = analysis?.insights?.alerts ?? []

  return (
    <div className="ai-card p-4 space-y-4">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} className="icon-sparkle" />
          <span className="section-title" style={{ marginBottom: 0 }}>Inteligência IA</span>
        </div>
        {score > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="score-bar" style={{ width: 60 }}>
              <div className="score-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
            </div>
            <span className="font-mono-metric" style={{ fontSize: 12, color: scoreColor }}>{score}</span>
          </div>
        )}
      </div>

      {analysis?.summary_text && (
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, borderLeft: '2px solid var(--accent)', paddingLeft: 10 }}>
          {analysis.summary_text}
        </p>
      )}

      {insights.length > 0 && (
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>Insights</div>
          {insights.map((ins, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <ChevronRight size={12} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent)' }} />
              {ins}
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <div className="section-title" style={{ marginBottom: 6 }}>Recomendações</div>
          {suggestions.map((sug, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <ChevronRight size={12} style={{ flexShrink: 0, marginTop: 2, color: 'var(--success)' }} />
              {sug}
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div>
          <div className="section-title" style={{ marginBottom: 6, color: 'var(--danger)' }}>Alertas</div>
          {alerts.map((alt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, fontSize: 12, color: '#fca5a5' }}>
              <div className="dot-pulse" style={{ marginTop: 4 }} />
              {alt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
