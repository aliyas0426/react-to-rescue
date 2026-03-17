import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  disaster_type: string | null;
  location_lat: number | null;
  location_lng: number | null;
  radius_km: number | null;
  is_active: boolean;
  created_at: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    supabase.from('alerts').select('*').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAlerts(data); });

    const channel = supabase
      .channel('alerts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setAlerts(prev => [payload.new as Alert, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setAlerts(prev => prev.map(a => a.id === (payload.new as Alert).id ? payload.new as Alert : a));
        } else if (payload.eventType === 'DELETE') {
          setAlerts(prev => prev.filter(a => a.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return alerts.filter(a => a.is_active);
}
