import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapView, type MapMarker } from '@/components/MapView';
import { Hospital, Home, UtensilsCrossed, Flame, Shield, Package } from 'lucide-react';

const resourceIcons: Record<string, any> = {
  hospital: Hospital,
  shelter: Home,
  food_center: UtensilsCrossed,
  fire_station: Flame,
  police_station: Shield,
  other: Package,
};

export default function Resources() {
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('resources').select('*').order('name').then(({ data }) => setResources(data || []));
  }, []);

  const markers: MapMarker[] = resources.map(r => ({
    id: r.id, lat: r.location_lat, lng: r.location_lng,
    title: r.name, description: `${r.resource_type} - ${r.address || ''}`, type: 'resource',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Resources</h1>
        <p className="text-muted-foreground">Nearby hospitals, shelters, and emergency services</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="h-[350px] rounded-lg overflow-hidden">
            <MapView markers={markers} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">No resources found. Admin can add resources.</p>
        )}
        {resources.map(r => {
          const Icon = resourceIcons[r.resource_type] || Package;
          return (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm">{r.name}</h3>
                    <Badge variant="outline" className="mt-1">{r.resource_type.replace('_', ' ')}</Badge>
                    {r.address && <p className="text-xs text-muted-foreground mt-1">{r.address}</p>}
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="text-xs text-primary hover:underline mt-1 block">{r.phone}</a>
                    )}
                    <Badge variant={r.is_available ? 'default' : 'destructive'} className="mt-2">
                      {r.is_available ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
