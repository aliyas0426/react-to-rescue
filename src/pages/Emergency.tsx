import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Siren, Flame, Heart, Shield, AlertTriangle } from 'lucide-react';

const emergencyContacts = [
  { name: 'Emergency Services', number: '911', icon: Siren, color: 'bg-destructive' },
  { name: 'Fire Department', number: '101', icon: Flame, color: 'bg-warning' },
  { name: 'Medical Emergency', number: '102', icon: Heart, color: 'bg-success' },
  { name: 'Police', number: '100', icon: Shield, color: 'bg-primary' },
  { name: 'Disaster Helpline', number: '108', icon: AlertTriangle, color: 'bg-secondary' },
];

export default function Emergency() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Emergency Contacts</h1>
        <p className="text-muted-foreground">Quick access to emergency services</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {emergencyContacts.map(c => (
          <Card key={c.number} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className={`w-16 h-16 rounded-2xl ${c.color} flex items-center justify-center`}>
                <c.icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{c.name}</h3>
                <p className="text-2xl font-mono font-bold text-primary">{c.number}</p>
              </div>
              <Button asChild className="w-full" size="lg">
                <a href={`tel:${c.number}`}>
                  <Phone className="w-5 h-5 mr-2" /> Call Now
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">⚠️ In Case of Emergency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Stay calm and assess the situation</p>
          <p>2. Call emergency services immediately</p>
          <p>3. Follow evacuation routes if necessary</p>
          <p>4. Help others if safe to do so</p>
          <p>5. Report the disaster through this app</p>
        </CardContent>
      </Card>
    </div>
  );
}
