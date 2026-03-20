import { useAuth } from '@/contexts/AuthContext';
import type { Plan } from '@/types';
import { PLAN_CONFIGS } from '@/types';

const PLAN_HIERARCHY: Record<string, number> = {
  starter: 1,
  pro: 2,
  agency: 3,
};

export function usePlan() {
  const { profile } = useAuth();

  const currentPlan = profile?.plan ?? null;
  const planStatus = profile?.plan_status ?? 'inactive';
  const isActive = planStatus === 'active' || planStatus === 'trial';
  const isTrial = planStatus === 'trial';

  function hasAccess(requiredPlan: Plan): boolean {
    if (!currentPlan || !isActive) return false;
    return (PLAN_HIERARCHY[currentPlan] ?? 0) >= (PLAN_HIERARCHY[requiredPlan] ?? 0);
  }

  function getMaxAccounts(): number {
    if (!currentPlan) return 1;
    return PLAN_CONFIGS[currentPlan]?.maxAccounts ?? 1;
  }

  function canGenerateReport(): boolean {
    return isActive;
  }

  function hasWhiteLabel(): boolean {
    return hasAccess('pro');
  }

  function hasAiAutopilot(): boolean {
    return hasAccess('pro');
  }

  function hasUnlimitedAi(): boolean {
    return hasAccess('agency');
  }

  function getCreditsRemaining(): number {
    return profile?.ai_credits_remaining ?? 0;
  }

  function getDaysUntilExpiry(): number | null {
    if (!profile?.plan_expires_at) return null;
    return Math.ceil(
      (new Date(profile.plan_expires_at).getTime() - Date.now()) / 86400000
    );
  }

  return {
    currentPlan,
    planStatus,
    isActive,
    isTrial,
    hasAccess,
    getMaxAccounts,
    canGenerateReport,
    hasWhiteLabel,
    hasAiAutopilot,
    hasUnlimitedAi,
    getCreditsRemaining,
    getDaysUntilExpiry,
    planConfig: currentPlan ? PLAN_CONFIGS[currentPlan] : null,
  };
}
