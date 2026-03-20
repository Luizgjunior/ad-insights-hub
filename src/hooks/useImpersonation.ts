import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ImpersonationData {
  gestorId: string;
  gestorName: string;
  gestorEmail: string;
}

export function useImpersonation() {
  const [impersonating, setImpersonating] = useState<ImpersonationData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('metaflux_impersonate');
    if (stored) {
      try {
        setImpersonating(JSON.parse(stored));
      } catch {
        localStorage.removeItem('metaflux_impersonate');
      }
    }
  }, []);

  function startImpersonation(data: ImpersonationData) {
    localStorage.setItem('metaflux_impersonate', JSON.stringify(data));
    setImpersonating(data);
    navigate('/gestor');
  }

  function stopImpersonation() {
    localStorage.removeItem('metaflux_impersonate');
    setImpersonating(null);
    navigate('/admin');
  }

  return { impersonating, startImpersonation, stopImpersonation };
}
