import { useAuth } from '@/contexts/AuthContext';
import { useLocation, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BarChart2, Sparkles, FileText,
  Bell, Settings, Home, TrendingUp, HelpCircle, Globe,
  Building2, DollarSign, LogOut, Zap, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlerts } from '@/hooks/useAlerts';
import { usePlan } from '@/hooks/usePlan';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

function useNavItems(): NavItem[] {
  const { profile } = useAuth();
  const { unreadCount } = useAlerts();

  if (profile?.role === 'admin_global') {
    return [
      { to: '/admin', icon: Globe, label: 'Overview' },
      { to: '/admin/tenants', icon: Building2, label: 'Tenants' },
      { to: '/admin/receita', icon: DollarSign, label: 'Receita' },
      { to: '/settings', icon: Settings, label: 'Configurações' },
    ];
  }

  if (profile?.role === 'usuario_cliente') {
    return [
      { to: '/dashboard', icon: Home, label: 'Início' },
      { to: '/dashboard/metricas', icon: TrendingUp, label: 'Minhas Métricas' },
      { to: '/gestor/relatorios', icon: FileText, label: 'Relatórios' },
      { to: '/suporte', icon: HelpCircle, label: 'Suporte' },
    ];
  }

  // admin_gestor (default)
  return [
    { to: '/gestor', icon: LayoutDashboard, label: 'Visão Geral' },
    { to: '/gestor/clientes', icon: Users, label: 'Clientes' },
    { to: '/gestor/campanhas', icon: BarChart2, label: 'Campanhas' },
    { to: '/gestor/ia', icon: Sparkles, label: 'Inteligência IA', badge: 3 },
    { to: '/gestor/relatorios', icon: FileText, label: 'Relatórios' },
    { to: '/gestor/alertas', icon: Bell, label: 'Alertas', badge: unreadCount },
    { to: '/settings', icon: Settings, label: 'Configurações' },
  ];
}

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navItems = useNavItems();

  const roleLabel: Record<string, string> = {
    admin_global: 'Admin',
    admin_gestor: 'Gestor',
    usuario_cliente: 'Cliente',
  };

  return (
    <aside className="hidden lg:flex h-screen w-60 flex-col bg-surface border-r border-border fixed left-0 top-0 z-30 animate-slide-in-left">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 border-b border-border shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Zap className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-base font-bold text-foreground tracking-tight">MetaFlux</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to ||
            (to !== '/gestor' && to !== '/admin' && to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative',
                isActive
                  ? 'nav-item-active'
                  : 'text-muted-foreground hover:bg-card-hover hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white badge-pill">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground uppercase shrink-0">
            {profile?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-primary badge-pill bg-primary/10 px-2 py-0.5 mt-0.5">
              {roleLabel[profile?.role || 'admin_gestor']}
            </span>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors active:scale-95"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export { useNavItems };
