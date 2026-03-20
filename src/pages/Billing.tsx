import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
  {
    name: 'Starter',
    price: 'R$ 97/mês',
    features: ['Até 3 contas Meta', '50 créditos IA/mês', 'Relatórios semanais', 'Alertas básicos'],
    key: 'starter',
  },
  {
    name: 'Pro',
    price: 'R$ 197/mês',
    features: ['Até 10 contas Meta', '200 créditos IA/mês', 'Relatórios personalizados', 'Alertas avançados', 'White label'],
    key: 'pro',
    popular: true,
  },
  {
    name: 'Agency',
    price: 'R$ 497/mês',
    features: ['Contas ilimitadas', 'Créditos IA ilimitados', 'API access', 'Suporte prioritário', 'White label completo', 'Multi-gestor'],
    key: 'agency',
  },
];

export default function Billing() {
  const { profile } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
        <div className="animate-reveal-up">
          <h1 className="text-2xl font-bold tracking-tight">Plano e Cobrança</h1>
          <p className="text-muted-foreground mt-1">
            Plano atual: <span className="font-medium text-foreground capitalize">{profile?.plan || 'Trial'}</span>
            {' · '}
            Status: <span className="font-medium text-foreground capitalize">{profile?.plan_status || 'trial'}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <Card
              key={plan.key}
              className={cn(
                'relative animate-reveal-up',
                plan.popular && 'border-primary shadow-lg shadow-primary/10'
              )}
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <p className="text-2xl font-bold tabular-nums">{plan.price}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.popular ? 'default' : 'outline'}
                  className="w-full active:scale-[0.98]"
                >
                  {profile?.plan === plan.key ? 'Plano atual' : 'Escolher plano'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
