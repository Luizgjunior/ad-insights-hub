import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Alert } from '@/types';
import { toast } from 'sonner';

export function useAlerts() {
  const { user, profile } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setAlerts(data.map(a => ({
        id: a.id,
        meta_account_id: a.meta_account_id || '',
        gestor_id: a.gestor_id || undefined,
        client_id: a.client_id || undefined,
        alert_type: a.alert_type as Alert['alert_type'],
        severity: (a.severity || 'warning') as Alert['severity'],
        title: a.title,
        body: a.body || undefined,
        is_read: a.is_read ?? false,
        is_resolved: a.is_resolved ?? false,
        metadata: (a.metadata as Record<string, unknown>) || undefined,
        created_at: a.created_at || '',
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Realtime subscription
  useEffect(() => {
    if (!profile) return;

    const filter = profile.role === 'admin_gestor'
      ? `gestor_id=eq.${profile.id}`
      : profile.role === 'usuario_cliente'
      ? `client_id=eq.${profile.id}`
      : undefined;

    const channel = supabase
      .channel('alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alerts',
          ...(filter ? { filter } : {}),
        },
        (payload) => {
          const newAlert = payload.new as any;
          const mapped: Alert = {
            id: newAlert.id,
            meta_account_id: newAlert.meta_account_id || '',
            gestor_id: newAlert.gestor_id || undefined,
            client_id: newAlert.client_id || undefined,
            alert_type: newAlert.alert_type,
            severity: newAlert.severity || 'warning',
            title: newAlert.title,
            body: newAlert.body || undefined,
            is_read: false,
            is_resolved: false,
            metadata: newAlert.metadata || undefined,
            created_at: newAlert.created_at || '',
          };
          setAlerts(prev => [mapped, ...prev]);

          const toastFn = mapped.severity === 'critical'
            ? toast.error
            : mapped.severity === 'warning'
            ? toast.warning
            : toast.info;

          toastFn(mapped.title, {
            description: mapped.body,
            duration: mapped.severity === 'critical' ? 8000 : 5000,
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const unreadCount = alerts.filter(a => !a.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
  };

  const markAllAsRead = async () => {
    const unreadIds = alerts.filter(a => !a.is_read).map(a => a.id);
    if (unreadIds.length === 0) return;
    await supabase.from('alerts').update({ is_read: true }).in('id', unreadIds);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const resolveAlert = async (id: string) => {
    await supabase.from('alerts').update({ is_resolved: true, is_read: true }).eq('id', id);
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alerta resolvido.');
  };

  return { alerts, unreadCount, loading, markAsRead, markAllAsRead, resolveAlert, refetch: fetchAlerts };
}
