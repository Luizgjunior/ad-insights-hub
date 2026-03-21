import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';

interface TopBarProps {
  title: string;
  onOpenAlerts?: () => void;
}

export default function TopBar({ title, onOpenAlerts }: TopBarProps) {
  const { profile } = useAuth();
  const { unreadCount, alerts } = useAlerts();
  const hasCritical = alerts.some(a => a.severity === 'critical' && !a.is_read);

  return (
    <header
      className="lg:hidden flex items-center justify-between h-14 px-4 sticky top-0 z-30"
      style={{
        background: 'var(--surface-1)',
        borderBottom: '0.5px solid var(--border-subtle)',
      }}
    >
      <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{title}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-md transition-colors active:scale-95"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={`absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-medium text-white ${hasCritical ? 'animate-badge-pulse' : ''}`}
              style={{ background: 'var(--danger)' }}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium uppercase"
          style={{ background: 'var(--surface-3)', color: 'var(--text-primary)' }}
        >
          {profile?.full_name?.charAt(0) || '?'}
        </div>
      </div>
    </header>
  );
}
