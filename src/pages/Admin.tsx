import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Check, X, Trash2, Plus, Users, FileText, Package, BarChart3 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';

export default function Admin() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [newResource, setNewResource] = useState({ name: '', resource_type: 'hospital', location_lat: '', location_lng: '', address: '', phone: '' });

  useEffect(() => {
    if (!isAdmin) return;
    loadAdmin();
  }, [isAdmin]);

  async function loadAdmin() {
    const [{ data: reps }, { data: profs }] = await Promise.all([
      supabase.from('disaster_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ]);
    setReports(reps || []);
    setUsers(profs || []);

    // Build chart data by type
    const typeCounts: Record<string, number> = {};
    (reps || []).forEach(r => { typeCounts[r.disaster_type] = (typeCounts[r.disaster_type] || 0) + 1; });
    setChartData(Object.entries(typeCounts).map(([name, value]) => ({ name, value })));
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('disaster_reports').update({ status } as any).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Report ${status}`);
    loadAdmin();
  }

  async function deleteReport(id: string) {
    const { error } = await supabase.from('disaster_reports').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Report deleted');
    loadAdmin();
  }

  async function addResource(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('resources').insert({
      name: newResource.name,
      resource_type: newResource.resource_type as any,
      location_lat: parseFloat(newResource.location_lat),
      location_lng: parseFloat(newResource.location_lng),
      address: newResource.address || null,
      phone: newResource.phone || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Resource added');
    setNewResource({ name: '', resource_type: 'hospital', location_lat: '', location_lng: '', address: '', phone: '' });
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card><CardContent className="p-8 text-center">
          <p className="text-destructive font-medium">Access denied. Admin only.</p>
        </CardContent></Card>
      </div>
    );
  }

  const COLORS = ['hsl(220,70%,50%)', 'hsl(0,72%,51%)', 'hsl(38,92%,50%)', 'hsl(142,71%,45%)', 'hsl(280,60%,50%)', 'hsl(45,93%,58%)', 'hsl(180,60%,45%)', 'hsl(330,60%,50%)'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage reports, users, and resources</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div><p className="text-sm text-muted-foreground">Reports</p><p className="text-2xl font-bold">{reports.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
            <Users className="w-6 h-6 text-accent" />
          </div>
          <div><p className="text-sm text-muted-foreground">Users</p><p className="text-2xl font-bold">{users.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-warning" />
          </div>
          <div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{reports.filter(r => r.status === 'pending').length}</p></div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="resources">Add Resource</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-3">
          {reports.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{r.title}</h3>
                    <Badge variant="outline">{r.disaster_type}</Badge>
                    <Badge variant="outline">{r.severity}</Badge>
                    <Badge>{r.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{r.description}</p>
                </div>
                <div className="flex gap-2 ml-4 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'approved')}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, 'rejected')}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => deleteReport(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {reports.length === 0 && <p className="text-center text-muted-foreground py-8">No reports</p>}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Reports by Type</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={Object.fromEntries(chartData.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]))} className="h-[300px]">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : <p className="text-muted-foreground text-sm text-center py-8">No data</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Distribution</CardTitle></CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ChartContainer config={Object.fromEntries(chartData.map((d, i) => [d.name, { label: d.name, color: COLORS[i % COLORS.length] }]))} className="h-[300px]">
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                        {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : <p className="text-muted-foreground text-sm text-center py-8">No data</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader><CardTitle>Add New Resource</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addResource} className="space-y-4 max-w-lg">
                <Input placeholder="Name" value={newResource.name} onChange={e => setNewResource(r => ({ ...r, name: e.target.value }))} required />
                <Select value={newResource.resource_type} onValueChange={v => setNewResource(r => ({ ...r, resource_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['hospital', 'shelter', 'food_center', 'fire_station', 'police_station', 'other'].map(t => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Latitude" value={newResource.location_lat} onChange={e => setNewResource(r => ({ ...r, location_lat: e.target.value }))} required />
                  <Input placeholder="Longitude" value={newResource.location_lng} onChange={e => setNewResource(r => ({ ...r, location_lng: e.target.value }))} required />
                </div>
                <Input placeholder="Address" value={newResource.address} onChange={e => setNewResource(r => ({ ...r, address: e.target.value }))} />
                <Input placeholder="Phone" value={newResource.phone} onChange={e => setNewResource(r => ({ ...r, phone: e.target.value }))} />
                <Button type="submit"><Plus className="w-4 h-4 mr-2" /> Add Resource</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
