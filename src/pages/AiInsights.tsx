import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Sparkles } from 'lucide-react';

const mockInsights = [
  {
    id: '1',
    type: 'suggestion',
    title: 'Otimizar orçamento da campanha "Leads Março"',
    summary: 'A campanha tem CPA crescente nos últimos 3 dias. Recomendo redistribuir 30% do orçamento para o conjunto "Lookalike 2%" que está performando melhor.',
    createdAt: 'Hoje, 14:32',
  },
  {
    id: '2',
    type: 'daily',
    title: 'Análise diária — 19 de março',
    summary: 'Gasto total R$480. ROAS geral 3.17x (+2.1% vs dia anterior). O criativo de vídeo 15s continua como melhor performer com CTR de 2.8%.',
    createdAt: 'Ontem, 08:00',
  },
  {
    id: '3',
    type: 'alert',
    title: 'Fadiga de criativo detectada',
    summary: 'O conjunto "Retargeting Site" está com frequência 4.2 e CTR em queda. Considere adicionar novos criativos ou pausar os anúncios com mais de 14 dias.',
    createdAt: '18/03, 16:45',
  },
];

export default function AiInsights() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold tracking-tight">IA Insights</h1>
          <p className="text-muted-foreground mt-1">Análises e sugestões inteligentes para suas campanhas</p>
        </div>

        <div className="space-y-4">
          {mockInsights.map((insight, i) => (
            <Card key={insight.id} className="animate-reveal-up" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0 mt-0.5">
                    {insight.type === 'suggestion' ? (
                      <Sparkles className="h-5 w-5 text-accent" />
                    ) : (
                      <Cpu className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{insight.title}</p>
                    <p className="text-sm text-muted-foreground text-pretty leading-relaxed">{insight.summary}</p>
                    <p className="text-xs text-muted-foreground/60 pt-1">{insight.createdAt}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
