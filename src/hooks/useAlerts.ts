import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Alert } from '@/types';

export function useAlerts() {
  const { user } = useAuth();
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

    const channel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
        fetchAlerts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAlerts]);

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

  return { alerts, unreadCount, loading, markAsRead, markAllAsRead, refetch: fetchAlerts };
}
