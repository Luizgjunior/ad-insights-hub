import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PLAN_CONFIGS } from '@/types';
import type { Plan } from '@/types';

const planList: { key: Plan; popular?: boolean }[] = [
  { key: 'starter' },
  { key: 'pro', popular: true },
  { key: 'agency' },
];

const planFeatures: Record<Plan, string[]> = {
  starter: ['Até 3 contas Meta', '50 créditos IA/mês', 'Relatórios semanais', 'Alertas básicos'],
  pro: ['Até 10 contas Meta', '200 créditos IA/mês', 'Relatórios diários', 'IA Autopilot', 'White Label'],
  agency: ['Contas ilimitadas', 'IA ilimitada', 'Relatórios em tempo real', 'API access', 'White Label completo', 'Multi-gestor'],
};

export default function PlanSettings() {
  const { profile } = useAuth();

  return (
    <AppShell title="Plano">
      <div className="p-5 lg:p-8 space-y-6 max-w-5xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Plano e Cobrança</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Plano atual: <span className="font-medium text-foreground capitalize">{profile?.plan || 'Trial'}</span>
            {' · '}Status: <span className="font-medium text-foreground capitalize">{profile?.plan_status || 'trial'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planList.map(({ key, popular }, i) => {
            const config = PLAN_CONFIGS[key];
            const isCurrent = profile?.plan === key;
            return (
              <div
                key={key}
                className={cn(
                  'card-surface p-6 relative animate-reveal-up',
                  popular && 'border-primary/50 shadow-primary/10'
                )}
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                {popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/12 px-3 py-0.5 badge-pill">
                    Popular
                  </span>
                )}
                <h3 className="text-base font-bold text-foreground">{config.name}</h3>
                <p className="text-2xl font-bold font-mono-metric text-foreground mt-1">
                  R$ {config.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
                <ul className="space-y-2.5 mt-5">
                  {planFeatures[key].map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={popular ? 'default' : 'outline'}
                  className={cn('w-full mt-6 active:scale-[0.97]', !popular && 'border-border')}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Plano atual' : 'Escolher plano'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
