import { useEffect } from 'react';
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
      { to: '/admin/custos', icon: DollarSign, label: 'Custo API' },
      { to: '/admin/logs', icon: AlertCircle, label: 'Logs' },
      { to: '/admin/settings', icon: Settings, label: 'Configurações' },
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

  useEffect(() => {
    const sidebar = document.getElementById('sidebar-container');
    if (!sidebar) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = sidebar.getBoundingClientRect();
      sidebar.style.setProperty('--sx', `${e.clientX - rect.left}px`);
      sidebar.style.setProperty('--sy', `${e.clientY - rect.top}px`);
    };
    sidebar.addEventListener('mousemove', handleMouseMove);
    return () => sidebar.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <aside
      id="sidebar-container"
      className="hidden lg:flex h-screen w-60 flex-col fixed left-0 top-0 z-30 animate-slide-in-left"
      style={{
        background: 'var(--surface-1)',
        borderRight: '0.5px solid var(--border-subtle)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Mouse glow */}
      <div
        style={{
          position: 'absolute',
          width: 200,
          height: 200,
          top: 'calc(var(--sy, -200px) - 100px)',
          left: 'calc(var(--sx, -200px) - 100px)',
          background: 'radial-gradient(circle, rgba(47,128,237,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          transition: 'top 60ms, left 60ms',
          zIndex: 0,
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-14 shrink-0 relative z-10" style={{ borderBottom: '0.5px solid var(--border-subtle)' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'var(--accent)' }}>
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>MetaFlux</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto relative z-10">
        {navItems.map(({ to, icon: Icon, label, badge }) => {
          const isActive = location.pathname === to ||
            (to !== '/gestor' && to !== '/admin' && to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'sidebar-item',
                isActive && 'active'
              )}
            >
              <Icon className="sidebar-icon" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && badge > 0 && (
                <span
                  className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-medium text-white"
                  style={{ background: 'var(--danger)', fontSize: 10 }}
                >
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Trial banner */}
      <TrialMini />

      {/* User footer */}
      <div className="relative z-10 p-3" style={{ borderTop: '0.5px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium shrink-0"
            style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
          >
            {profile?.full_name?.charAt(0) || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }} className="truncate">
              {profile?.full_name || 'Usuário'}
            </p>
            <span
              className="inline-block mt-0.5"
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: 'var(--accent)',
                background: 'var(--accent-muted)',
                padding: '1px 6px',
                borderRadius: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {roleLabel[profile?.role || 'admin_gestor']}
            </span>
          </div>
          <button
            onClick={signOut}
            className="p-1.5 rounded-md transition-colors active:scale-95"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function TrialMini() {
  const { isTrial, getDaysUntilExpiry } = usePlan();
  const navigate = useNavigate();
  const daysLeft = getDaysUntilExpiry();

  if (!isTrial || daysLeft === null) return null;

  return (
    <div
      className="mx-3 mb-2 p-2.5 rounded-lg relative z-10"
      style={{
        background: 'var(--warning-muted)',
        border: '0.5px solid rgba(202,138,4,0.2)',
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: '#fbbf24' }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: '#fbbf24' }}>
          Trial — {daysLeft > 0 ? `${daysLeft} dias` : 'Expirado'}
        </span>
      </div>
      <button
        onClick={() => navigate('/settings/plano')}
        style={{ fontSize: 11, fontWeight: 500, color: 'var(--accent)' }}
        className="hover:underline"
      >
        Assinar agora →
      </button>
    </div>
  );
}

export { useNavItems };
