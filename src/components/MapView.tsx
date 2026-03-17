import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const severityColors: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
};

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  severity?: string;
  type?: 'disaster' | 'resource' | 'prediction';
  icon?: string;
}

interface Props {
  markers?: MapMarker[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (marker: MapMarker) => void;
  className?: string;
}

export function MapView({ markers = [], center = [20, 0], zoom = 3, onMarkerClick, className = '' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    mapInstance.current = L.map(mapRef.current).setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapInstance.current);

    markersLayer.current = L.layerGroup().addTo(mapInstance.current);

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markersLayer.current) return;
    markersLayer.current.clearLayers();

    markers.forEach(m => {
      const color = m.type === 'resource' ? '#3b82f6' : severityColors[m.severity || 'medium'] || '#6b7280';

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
          <span style="color:white;font-size:12px;font-weight:bold;">${m.type === 'resource' ? 'R' : m.type === 'prediction' ? 'P' : '!'}</span>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([m.lat, m.lng], { icon })
        .bindPopup(`<div><strong>${m.title}</strong>${m.description ? `<p style="margin:4px 0 0;font-size:12px;">${m.description}</p>` : ''}</div>`);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(m));
      }

      marker.addTo(markersLayer.current!);
    });
  }, [markers, onMarkerClick]);

  return <div ref={mapRef} className={`w-full h-full min-h-[400px] rounded-lg ${className}`} />;
}
