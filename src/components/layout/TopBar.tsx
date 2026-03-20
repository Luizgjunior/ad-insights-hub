import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAlerts } from '@/hooks/useAlerts';

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { profile } = useAuth();
  const { unreadCount } = useAlerts();

  return (
    <header className="lg:hidden flex items-center justify-between h-14 px-4 bg-surface border-b border-border sticky top-0 z-30">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-card-hover transition-colors active:scale-95">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground uppercase">
          {profile?.full_name?.charAt(0) || '?'}
        </div>
      </div>
    </header>
  );
}
