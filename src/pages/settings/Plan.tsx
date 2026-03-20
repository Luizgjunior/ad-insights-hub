import { useState } from 'react';
import { Check, Zap, Building2, Rocket, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_CONFIGS } from '@/types';
import type { Plan } from '@/types';
import AppShell from '@/components/layout/AppShell';
import PlanGate from '@/components/ui/PlanGate';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const CAKTO_LINKS: Record<Plan | 'addon', string> = {
  starter: 'https://cakto.com.br/metaflux-starter',
  pro: 'https://cakto.com.br/metaflux-pro',
  agency: 'https://cakto.com.br/metaflux-agency',
  addon: 'https://cakto.com.br/metaflux-addon',
};

const plans: {
  key: Plan;
  icon: React.ReactNode;
  colorClass: string;
  description: string;
  features: string[];
  notIncluded: string[];
  featured?: boolean;
}[] = [
  {
    key: 'starter',
    icon: <Zap size={20} />,
    colorClass: 'text-success',
    description: 'Para gestores começando a escalar',
    features: [
      '3 contas Meta Ads',
      'Relatórios semanais',
      'Alertas automáticos de performance',
      'Dashboard para clientes',
      '50 análises de IA por mês',
      'Suporte por email',
    ],
    notIncluded: [
      'Relatórios white-label',
      'IA autopilot',
      'Análises diárias',
    ],
  },
  {
    key: 'pro',
    icon: <Rocket size={20} />,
    colorClass: 'text-primary',
    description: 'Para gestores em crescimento',
    featured: true,
    features: [
      '10 contas Meta Ads',
      'Relatórios diários',
      'Alertas automáticos de performance',
      'Dashboard para clientes',
      '150 análises de IA por mês',
      'IA autopilot — sugestões automáticas',
      'Relatórios white-label com sua logo',
      'Suporte prioritário',
    ],
    notIncluded: [],
  },
  {
    key: 'agency',
    icon: <Building2 size={20} />,
    colorClass: 'text-warning',
    description: 'Para agências sem limites',
    features: [
      'Contas Meta Ads ilimitadas',
      'Relatórios em tempo real',
      'Alertas automáticos de performance',
      'Dashboard para clientes',
      'Análises de IA ilimitadas',
      'IA full access — análises e autopilot',
      'Relatórios white-label com sua logo',
      'Add-on análises extras disponível',
      'Suporte VIP',
    ],
    notIncluded: [],
  },
];

const faqItems = [
  {
    q: 'Posso cancelar a qualquer momento?',
    a: 'Sim. O cancelamento é feito direto pelo Cakto e o acesso permanece ativo até o fim do período pago.',
  },
  {
    q: 'O que acontece com meus dados se eu cancelar?',
    a: 'Seus dados ficam armazenados por 30 dias após o cancelamento. Você pode reativar o plano nesse período.',
  },
  {
    q: 'Posso fazer upgrade ou downgrade?',
    a: 'Sim. Para fazer upgrade, assine o novo plano pelo Cakto. O sistema é atualizado automaticamente via webhook.',
  },
  {
    q: 'Como funciona o trial?',
    a: '7 dias de acesso completo ao plano Pro sem cartão de crédito. Após o trial, você escolhe o plano que melhor se encaixa.',
  },
];

export default function PlanSettings() {
  const { profile } = useAuth();

  const currentPlan = profile?.plan ?? null;
  const planStatus = profile?.plan_status ?? 'inactive';
  const daysLeft = profile?.plan_expires_at
    ? Math.ceil((new Date(profile.plan_expires_at).getTime() - Date.now()) / 86400000)
    : null;

  function handleSelectPlan(plan: Plan) {
    const url = new URL(CAKTO_LINKS[plan]);
    if (profile?.email) url.searchParams.set('email', profile.email);
    if (profile?.id) url.searchParams.set('client_reference_id', profile.id);
    window.open(url.toString(), '_blank');
  }

  return (
    <AppShell title="Planos e Assinatura">
      <div className="p-5 lg:p-8 space-y-8 max-w-5xl mx-auto">
        {/* Trial banner */}
        {planStatus === 'trial' && daysLeft !== null && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-warning/10 border border-warning/20 animate-reveal-up">
            <AlertCircle className="h-5 w-5 text-warning shrink-0" />
            <span className="text-sm text-foreground">
              <strong>Trial ativo</strong> — {daysLeft > 0 ? `${daysLeft} dias restantes.` : 'Expirado.'} Assine para manter o acesso.
            </span>
          </div>
        )}

        {/* Active plan banner */}
        {planStatus === 'active' && currentPlan && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20 animate-reveal-up">
            <Check className="h-5 w-5 text-success shrink-0" />
            <span className="text-sm text-foreground">
              <strong>Plano {PLAN_CONFIGS[currentPlan].name} ativo.</strong> Próxima cobrança via Cakto.
            </span>
          </div>
        )}

        {/* Header */}
        <div className="text-center animate-reveal-up">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Escolha seu plano</h1>
          <p className="text-sm text-muted-foreground mt-1">Cancele quando quiser. Sem fidelidade.</p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const config = PLAN_CONFIGS[plan.key];
            const isCurrent = currentPlan === plan.key && planStatus === 'active';

            return (
              <div
                key={plan.key}
                className={cn(
                  'card-surface p-6 relative animate-reveal-up',
                  plan.featured && 'border-primary/50 shadow-primary/10'
                )}
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              >
                {plan.featured && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-primary-foreground bg-primary px-3 py-0.5 badge-pill">
                    Mais popular
                  </span>
                )}

                {isCurrent && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-2 py-0.5 badge-pill">
                    Plano atual
                  </span>
                )}

                <div className="flex items-center gap-2.5 mb-2">
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', plan.colorClass, 'bg-current/10')}>
                    <span className={plan.colorClass}>{plan.icon}</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{config.name}</span>
                </div>

                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-3xl font-bold font-mono-metric text-foreground">
                    R$ {config.price}
                  </span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.notIncluded.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                      <span className="w-4 shrink-0 text-center">–</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.featured ? 'default' : 'outline'}
                  className={cn('w-full active:scale-[0.97]', !plan.featured && 'border-border')}
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(plan.key)}
                >
                  {isCurrent ? 'Plano atual' : `Assinar ${config.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add-on */}
        <div className="card-surface p-5 flex items-center justify-between gap-4 flex-wrap animate-reveal-up" style={{ animationDelay: '400ms' }}>
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Add-on: Análises extras</p>
            <p className="text-xs text-muted-foreground">
              Pacote de 50 análises de IA adicionais para plano Agency com alto volume.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold font-mono-metric text-foreground">R$ 29</span>
            <PlanGate requiredPlan="agency">
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary active:scale-[0.97]"
                onClick={() => window.open(CAKTO_LINKS.addon, '_blank')}
              >
                Comprar pacote
              </Button>
            </PlanGate>
          </div>
        </div>

        {/* FAQ */}
        <div className="animate-reveal-up" style={{ animationDelay: '500ms' }}>
          <h3 className="text-base font-semibold text-foreground mb-4">Perguntas frequentes</h3>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className="card-surface p-4">
                <p className="text-sm font-medium text-foreground mb-1">{item.q}</p>
                <p className="text-xs text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
