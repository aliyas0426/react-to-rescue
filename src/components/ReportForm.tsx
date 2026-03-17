import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { saveOfflineReport } from '@/lib/offline-db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, MapPin, Loader2 } from 'lucide-react';

const disasterTypes = ['earthquake', 'flood', 'fire', 'hurricane', 'tornado', 'tsunami', 'landslide', 'drought', 'other'] as const;
const severities = ['low', 'medium', 'high', 'critical'] as const;

interface Props {
  onSuccess?: () => void;
}

export function ReportForm({ onSuccess }: Props) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    disaster_type: 'other' as typeof disasterTypes[number],
    severity: 'medium' as typeof severities[number],
    location_lat: '',
    location_lng: '',
    location_name: '',
  });
  const [image, setImage] = useState<File | null>(null);

  const detectLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, location_lat: String(pos.coords.latitude), location_lng: String(pos.coords.longitude) }));
        toast.success('Location detected');
      },
      () => toast.error('Could not detect location')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in'); return; }
    if (!form.title || !form.description || !form.location_lat || !form.location_lng) {
      toast.error('Fill all required fields'); return;
    }

    setLoading(true);
    try {
      if (!isOnline) {
        await saveOfflineReport({
          id: crypto.randomUUID(),
          title: form.title,
          description: form.description,
          disaster_type: form.disaster_type,
          severity: form.severity,
          location_lat: parseFloat(form.location_lat),
          location_lng: parseFloat(form.location_lng),
          location_name: form.location_name,
          created_at: new Date().toISOString(),
        });
        toast.success('Saved offline. Will sync when online.');
        onSuccess?.();
        return;
      }

      let imageUrl: string | null = null;
      if (image) {
        const ext = image.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('disaster-images').upload(path, image);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from('disaster-images').getPublicUrl(path);
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('disaster_reports').insert({
        user_id: user.id,
        title: form.title,
        description: form.description,
        disaster_type: form.disaster_type,
        severity: form.severity,
        location_lat: parseFloat(form.location_lat),
        location_lng: parseFloat(form.location_lng),
        location_name: form.location_name || null,
        image_url: imageUrl,
      });
      if (error) throw error;

      toast.success('Report submitted');
      setForm({ title: '', description: '', disaster_type: 'other', severity: 'medium', location_lat: '', location_lng: '', location_name: '' });
      setImage(null);
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-primary" />
          Report Disaster
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

          <Textarea placeholder="Description *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />

          <div className="grid grid-cols-2 gap-3">
            <Select value={form.disaster_type} onValueChange={v => setForm(f => ({ ...f, disaster_type: v as any }))}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {disasterTypes.map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v as any }))}>
              <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                {severities.map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Input placeholder="Latitude *" value={form.location_lat} onChange={e => setForm(f => ({ ...f, location_lat: e.target.value }))} className="flex-1" />
            <Input placeholder="Longitude *" value={form.location_lng} onChange={e => setForm(f => ({ ...f, location_lng: e.target.value }))} className="flex-1" />
            <Button type="button" variant="outline" size="icon" onClick={detectLocation}>
              <MapPin className="w-4 h-4" />
            </Button>
          </div>

          <Input placeholder="Location name (optional)" value={form.location_name} onChange={e => setForm(f => ({ ...f, location_name: e.target.value }))} />

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors">
              <Upload className="w-4 h-4" />
              {image ? image.name : 'Upload image'}
              <input type="file" accept="image/*" className="hidden" onChange={e => setImage(e.target.files?.[0] || null)} />
            </label>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {!isOnline ? 'Save Offline' : 'Submit Report'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function FileTextIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
  );
}
