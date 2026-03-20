import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import type { Plan } from '@/types';
import { PLAN_CONFIGS } from '@/types';
import { useNavigate } from 'react-router-dom';

interface PlanGateProps {
  requiredPlan: Plan;
  children: ReactNode;
}

export default function PlanGate({ requiredPlan, children }: PlanGateProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const planOrder: Plan[] = ['starter', 'pro', 'agency'];
  const userPlanIndex = profile?.plan ? planOrder.indexOf(profile.plan) : -1;
  const requiredIndex = planOrder.indexOf(requiredPlan);

  if (userPlanIndex >= requiredIndex) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-card">
        <Lock className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-semibold text-foreground mb-1">
          Disponível no plano {PLAN_CONFIGS[requiredPlan].name}
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Faça upgrade para desbloquear este recurso
        </p>
        <Button size="sm" onClick={() => navigate('/settings/plano')} className="active:scale-[0.97]">
          Fazer upgrade
        </Button>
      </div>
    </div>
  );
}
