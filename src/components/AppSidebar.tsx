import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3, LayoutDashboard, Users, Bell, FileText,
  Settings, LogOut, CreditCard, Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/accounts', icon: Users, label: 'Contas Meta' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/reports', icon: FileText, label: 'Relatórios' },
  { to: '/ai-insights', icon: Cpu, label: 'IA Insights' },
  { to: '/billing', icon: CreditCard, label: 'Plano' },
  { to: '/settings', icon: Settings, label: 'Configurações' },
];

export default function AppSidebar() {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border animate-slide-in-left">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <BarChart3 className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-semibold text-sidebar-primary-foreground tracking-tight">
          AdMetrics AI
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground uppercase">
            {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate">
              {profile?.email}
            </p>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md text-sidebar-foreground/60 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
