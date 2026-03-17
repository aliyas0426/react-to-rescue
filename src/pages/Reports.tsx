import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getUnsyncedReports, markReportSynced } from '@/lib/offline-db';
import { ReportForm } from '@/components/ReportForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Cloud, WifiOff } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [reports, setReports] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user) loadReports();
  }, [user]);

  async function loadReports() {
    const { data } = await supabase
      .from('disaster_reports')
      .select('*')
      .order('created_at', { ascending: false });
    setReports(data || []);
  }

  async function syncOfflineReports() {
    if (!user || !isOnline) return;
    setSyncing(true);
    try {
      const offline = await getUnsyncedReports();
      for (const r of offline) {
        const { error } = await supabase.from('disaster_reports').insert({
          user_id: user.id,
          title: r.title,
          description: r.description,
          disaster_type: r.disaster_type as any,
          severity: r.severity as any,
          location_lat: r.location_lat,
          location_lng: r.location_lng,
          location_name: r.location_name || null,
        });
        if (!error) await markReportSynced(r.id);
      }
      toast.success(`Synced ${offline.length} report(s)`);
      loadReports();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/10 text-warning',
    approved: 'bg-success/10 text-success',
    rejected: 'bg-destructive/10 text-destructive',
    resolved: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Disaster Reports</h1>
          <p className="text-muted-foreground">Submit and track disaster reports</p>
        </div>
        <Button variant="outline" onClick={syncOfflineReports} disabled={syncing || !isOnline}>
          {!isOnline ? <WifiOff className="w-4 h-4 mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
          {syncing ? 'Syncing...' : 'Sync Offline'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ReportForm onSuccess={loadReports} />
        </div>

        <div className="lg:col-span-2 space-y-4">
          {reports.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No reports yet. Be the first to report!
              </CardContent>
            </Card>
          )}
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{r.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{r.disaster_type}</Badge>
                      <Badge variant="outline">{r.severity}</Badge>
                      <Badge className={statusColors[r.status] || ''}>{r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.location_name || `${r.location_lat.toFixed(2)}, ${r.location_lng.toFixed(2)}`} • {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {r.image_url && (
                    <img src={r.image_url} alt="" className="w-20 h-20 rounded-lg object-cover ml-4" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
