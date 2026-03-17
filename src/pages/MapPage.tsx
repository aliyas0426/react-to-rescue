import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapView, type MapMarker } from '@/components/MapView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MapPage() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [selected, setSelected] = useState<MapMarker | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMarkers();
  }, []);

  async function loadMarkers() {
    const [{ data: reports }, { data: resources }] = await Promise.all([
      supabase.from('disaster_reports').select('*').eq('status', 'approved'),
      supabase.from('resources').select('*'),
    ]);

    const rMarkers: MapMarker[] = (reports || []).map(r => ({
      id: r.id, lat: r.location_lat, lng: r.location_lng,
      title: r.title, description: r.description, severity: r.severity, type: 'disaster' as const,
    }));
    const resMarkers: MapMarker[] = (resources || []).map(r => ({
      id: r.id, lat: r.location_lat, lng: r.location_lng,
      title: r.name, description: r.description || r.resource_type, type: 'resource' as const,
    }));
    setMarkers([...rMarkers, ...resMarkers]);
  }

  const filteredMarkers = filter === 'all' ? markers
    : filter === 'disasters' ? markers.filter(m => m.type === 'disaster')
    : markers.filter(m => m.type === 'resource');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Disaster Map</h1>
          <p className="text-muted-foreground">View all incidents and resources</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="disasters">Disasters</SelectItem>
            <SelectItem value="resources">Resources</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="h-[600px] rounded-lg overflow-hidden">
                <MapView markers={filteredMarkers} onMarkerClick={setSelected} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-lg">{selected.title}</h3>
                  <Badge variant={selected.type === 'resource' ? 'secondary' : 'destructive'}>
                    {selected.type}
                  </Badge>
                  {selected.severity && <Badge className="ml-2">{selected.severity}</Badge>}
                  {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
                  <p className="text-xs text-muted-foreground">
                    📍 {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Click a marker to see details</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
