import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import type { Plan } from '@/types';
import { useNavigate } from 'react-router-dom';

const PLAN_HIERARCHY: Record<Plan, number> = {
  starter: 1,
  pro: 2,
  agency: 3,
};

interface PlanGateProps {
  requiredPlan: Plan;
  children: ReactNode;
  featureName?: string;
  showOverlay?: boolean;
}

export default function PlanGate({ requiredPlan, children, featureName, showOverlay = true }: PlanGateProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const currentPlan = profile?.plan ?? 'starter';
  const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan];
  const hasAccess = currentLevel >= requiredLevel &&
    (profile?.plan_status === 'active' || profile?.plan_status === 'trial');

  if (hasAccess) return <>{children}</>;
  if (!showOverlay) return null;

  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-30 blur-[2px] select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-card gap-3 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Lock className="h-[18px] w-[18px] text-primary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground mb-1">
            {featureName ?? 'Esta funcionalidade'} requer o plano {planLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            Faça upgrade para desbloquear
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/settings/plano')} className="active:scale-[0.97]">
          Ver planos
        </Button>
      </div>
    </div>
  );
}
