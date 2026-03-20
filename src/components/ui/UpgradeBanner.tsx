import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UpgradeBannerProps {
  feature: string;
  requiredPlan: 'pro' | 'agency';
  compact?: boolean;
}

export default function UpgradeBanner({ feature, requiredPlan, compact }: UpgradeBannerProps) {
  const navigate = useNavigate();
  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs text-foreground flex-1">
          {feature} — plano {planLabel}
        </span>
        <button
          onClick={() => navigate('/settings/plano')}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Ver planos
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20 flex-wrap">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 shrink-0">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {feature} está disponível no plano {planLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            Faça upgrade para desbloquear esta funcionalidade
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate('/settings/plano')}
        className="active:scale-[0.97]"
      >
        Ver planos
      </Button>
    </div>
  );
}
