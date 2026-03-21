import type { AiAnalysis } from '@/types';
import { Sparkles, TrendingUp, Lightbulb, AlertTriangle, Clock } from 'lucide-react';

interface AiInsightCardProps {
  analysis: AiAnalysis;
  compact?: boolean;
  showCost?: boolean;
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-success' : score >= 50 ? 'text-warning' : 'text-danger';
  const bgColor = score >= 80 ? 'bg-success/20' : score >= 50 ? 'bg-warning/20' : 'bg-danger/20';
  const label = score >= 80 ? 'Excelente' : score >= 60 ? 'Bom' : score >= 40 ? 'Regular' : 'Crítico';

  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-14 w-14 items-center justify-center rounded-full ${bgColor}`}>
        <span className={`text-lg font-bold font-mono ${color}`}>{score}</span>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score >= 80 ? 'bg-success' : score >= 50 ? 'bg-warning' : 'bg-danger'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`text-xs font-semibold ${color}`}>{label}</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Score de performance</span>
      </div>
    </div>
  );
}

export default function AiInsightCard({ analysis, compact = false, showCost = false }: AiInsightCardProps) {
  const insights = (analysis.insights as any) || {};
  const score = insights.score ?? 50;
  const insightList: string[] = insights.insights || [];
  const suggestions: string[] = insights.suggestions || [];
  const alerts: string[] = insights.alerts || [];
  const createdAt = analysis.created_at ? new Date(analysis.created_at) : null;

  if (compact) {
    return (
      <div className="card-surface p-4 border-l-2 border-primary">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Análise IA</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{analysis.summary_text || 'Sem resumo disponível.'}</p>
        {insightList.slice(0, 2).map((item, i) => (
          <div key={i} className="flex items-start gap-2 mt-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span className="text-xs text-muted-foreground">{item}</span>
          </div>
        ))}
        {createdAt && (
          <div className="flex items-center gap-1 mt-3">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              Atualizado em {createdAt.toLocaleDateString('pt-BR')} às {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card-surface p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Análise {analysis.analysis_type === 'daily' ? 'Diária' : analysis.analysis_type === 'weekly' ? 'Semanal' : 'IA'}
          </span>
        </div>
        <ScoreGauge score={score} />
      </div>

      {analysis.summary_text && (
        <p className="text-sm text-muted-foreground bg-card/50 rounded-lg p-3 border border-border">
          {analysis.summary_text}
        </p>
      )}

      {insightList.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Insights</span>
          </div>
          {insightList.map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      )}

      {suggestions.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-warning" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Sugestões</span>
          </div>
          {suggestions.map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-warning mt-1.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-danger" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Alertas</span>
          </div>
          {alerts.map((item, i) => (
            <div key={i} className="flex items-start gap-2 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">
            {createdAt
              ? `${createdAt.toLocaleDateString('pt-BR')} às ${createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : '—'}
          </span>
        </div>
        {showCost && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {analysis.model_used || '—'} · {analysis.cost_usd !== undefined ? `US$ ${analysis.cost_usd.toFixed(4)}` : 'Grátis'}
          </span>
        )}
      </div>
    </div>
  );
}
