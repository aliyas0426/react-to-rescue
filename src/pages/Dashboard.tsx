import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAlerts } from '@/hooks/useAlerts';
import { StatsCard } from '@/components/StatsCard';
import { MapView, type MapMarker } from '@/components/MapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, Package, Brain, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Dashboard() {
  const alerts = useAlerts();
  const [stats, setStats] = useState({ reports: 0, resources: 0, predictions: 0 });
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ count: rCount }, { count: resCount }, { data: reports }, { data: preds }] = await Promise.all([
      supabase.from('disaster_reports').select('*', { count: 'exact', head: true }),
      supabase.from('resources').select('*', { count: 'exact', head: true }),
      supabase.from('disaster_reports').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('predictions').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    setStats({ reports: rCount || 0, resources: resCount || 0, predictions: preds?.length || 0 });
    setRecentReports(reports || []);
    setPredictions(preds || []);

    const reportMarkers: MapMarker[] = (reports || []).map(r => ({
      id: r.id, lat: r.location_lat, lng: r.location_lng,
      title: r.title, description: r.description, severity: r.severity, type: 'disaster' as const,
    }));
    const predMarkers: MapMarker[] = (preds || []).map(p => ({
      id: p.id, lat: p.location_lat, lng: p.location_lng,
      title: `${p.disaster_type} prediction`, description: `${Math.round(p.probability * 100)}% probability`,
      severity: p.probability > 0.7 ? 'high' : 'medium', type: 'prediction' as const,
    }));
    setMarkers([...reportMarkers, ...predMarkers]);
  }

  async function runPredictions() {
    setLoadingPredictions(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-predictions');
      if (error) throw error;
      toast.success('AI predictions updated');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Prediction failed');
    } finally {
      setLoadingPredictions(false);
    }
  }

  const severityColor: Record<string, string> = {
    critical: 'bg-destructive text-destructive-foreground',
    high: 'bg-warning text-warning-foreground',
    medium: 'bg-secondary text-secondary-foreground',
    low: 'bg-success text-success-foreground',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Real-time disaster monitoring overview</p>
        </div>
        <Button onClick={runPredictions} disabled={loadingPredictions}>
          {loadingPredictions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
          Run AI Predictions
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Alerts" value={alerts.length} icon={Bell} color="destructive" />
        <StatsCard title="Total Reports" value={stats.reports} icon={FileText} color="primary" />
        <StatsCard title="Resources" value={stats.resources} icon={Package} color="accent" />
        <StatsCard title="AI Predictions" value={stats.predictions} icon={Brain} color="secondary" />
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Live Disaster Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] rounded-lg overflow-hidden">
            <MapView markers={markers} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.length === 0 && <p className="text-muted-foreground text-sm">No reports yet</p>}
              {recentReports.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.location_name || `${r.location_lat.toFixed(2)}, ${r.location_lng.toFixed(2)}`}</p>
                  </div>
                  <Badge className={severityColor[r.severity] || ''}>{r.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" /> Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 && <p className="text-muted-foreground text-sm">No active alerts</p>}
              {alerts.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${a.severity === 'critical' ? 'bg-destructive animate-pulse' : a.severity === 'high' ? 'bg-warning' : 'bg-muted-foreground'}`} />
                  <div>
                    <p className="font-medium text-sm">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
