import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MetaAccountRow {
  id: string;
  client_id: string;
  gestor_id: string;
  ad_account_id: string;
  account_name: string | null;
  token_expires_at: string | null;
  token_last_refreshed_at: string | null;
  is_active: boolean | null;
  currency: string | null;
  timezone: string | null;
  created_at: string | null;
}

export function useMetaAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<MetaAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('meta_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setAccounts((data as MetaAccountRow[]) || []);
      setError(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();

    const channel = supabase
      .channel('meta_accounts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meta_accounts' }, () => {
        fetchAccounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAccounts]);

  return { accounts, loading, error, refetch: fetchAccounts };
}

export function useMetaAccount(id: string) {
  const [account, setAccount] = useState<MetaAccountRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('meta_accounts')
        .select('*')
        .eq('id', id)
        .single();
      if (err) setError(err.message);
      else setAccount(data as MetaAccountRow);
      setLoading(false);
    })();
  }, [id]);

  return { account, loading, error };
}
