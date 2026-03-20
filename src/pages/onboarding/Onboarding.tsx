import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap, BarChart2, Sparkles, FileText, ArrowRight, Check } from 'lucide-react';

const steps = [
  {
    icon: BarChart2,
    title: 'Conecte suas contas Meta',
    description: 'Vincule suas contas de anúncio do Meta Business para começar a monitorar métricas em tempo real.',
  },
  {
    icon: Sparkles,
    title: 'IA analisa suas campanhas',
    description: 'Nossa IA monitora performance, identifica problemas e sugere otimizações automaticamente.',
  },
  {
    icon: FileText,
    title: 'Relatórios automatizados',
    description: 'Receba relatórios completos gerados por IA com insights acionáveis para seus clientes.',
  },
];

export default function Onboarding() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);

  if (profile?.role === 'admin_global') return <Navigate to="/admin" replace />;

  return (
    <div className="min-h-screen bg-background bg-grid-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-reveal-up">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">MetaFlux</span>
        </div>

        <div className="card-surface p-8">
          <h2 className="text-lg font-bold text-foreground text-center mb-1">Bem-vindo ao MetaFlux!</h2>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Vamos configurar sua conta em 3 passos simples.
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, i) => {
              const StepIcon = step.icon;
              const isDone = i < currentStep;
              const isCurrent = i === currentStep;
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                    isCurrent ? 'border-primary/30 bg-primary/5' : isDone ? 'border-success/20 bg-success/5' : 'border-border'
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    isDone ? 'bg-success/20' : isCurrent ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    {isDone ? <Check className="h-4 w-4 text-success" /> : <StepIcon className={`h-4 w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`} />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-foreground' : isDone ? 'text-success' : 'text-muted-foreground'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i <= currentStep ? 'w-8 bg-primary' : 'w-4 bg-muted'}`} />
            ))}
          </div>

          {currentStep < steps.length - 1 ? (
            <Button className="w-full h-11 font-semibold active:scale-[0.98]" onClick={() => setCurrentStep(s => s + 1)}>
              Próximo passo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="w-full h-11 font-semibold active:scale-[0.98]" onClick={() => navigate('/settings/meta')}>
              Conectar conta Meta
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          <button
            onClick={() => navigate('/gestor')}
            className="block w-full text-center text-sm text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            Pular por agora
          </button>
        </div>
      </div>
    </div>
  );
}
