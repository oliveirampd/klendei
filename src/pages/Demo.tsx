import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { KlendeiLogo } from '@/components/KlendeiLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, CheckCircle, Clock, DollarSign, Users, Scissors, Plus, MessageCircle, Instagram, Sparkles, UserCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Demo data
const DEMO_BUSINESS = { name: 'Salão Demo Klendei', slug: 'salao-demo' };

const DEMO_PROFESSIONALS = [
  { id: 'p1', name: 'Ana Silva', specialty: 'Cabeleireira', photo_url: null },
  { id: 'p2', name: 'Carlos Lima', specialty: 'Barbeiro', photo_url: null },
  { id: 'p3', name: 'Juliana Costa', specialty: 'Manicure', photo_url: null },
];

const DEMO_SERVICES = [
  { id: 's1', name: 'Corte feminino', price: 80, duration_minutes: 45, icon_key: 'scissors' },
  { id: 's2', name: 'Corte masculino', price: 50, duration_minutes: 30, icon_key: 'scissors' },
  { id: 's3', name: 'Coloração completa', price: 220, duration_minutes: 150, icon_key: 'droplets' },
  { id: 's4', name: 'Manicure', price: 45, duration_minutes: 45, icon_key: 'hand' },
  { id: 's5', name: 'Hidratação', price: 120, duration_minutes: 60, icon_key: 'droplets' },
];

const DEMO_EXISTING_APPOINTMENTS = [
  { id: 'a1', client: 'Maria Santos', service: 'Corte feminino', professional: 'Ana Silva', time: '09:00', price: 80, status: 'confirmed' },
  { id: 'a2', client: 'João Oliveira', service: 'Corte masculino', professional: 'Carlos Lima', time: '10:00', price: 50, status: 'pending' },
  { id: 'a3', client: 'Camila Reis', service: 'Manicure', professional: 'Juliana Costa', time: '11:00', price: 45, status: 'confirmed' },
];

const DEMO_CLIENTS = [
  { id: 'c1', name: 'Maria Santos', phone: '11999887766', total_visits: 12, total_spent: 960 },
  { id: 'c2', name: 'João Oliveira', phone: '11998877665', total_visits: 5, total_spent: 250 },
  { id: 'c3', name: 'Camila Reis', phone: '11997766554', total_visits: 8, total_spent: 360 },
];

const TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'border-yellow-500 text-yellow-600' },
  confirmed: { label: 'Confirmado', className: 'border-green-500 text-green-600' },
};

export default function Demo() {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<typeof DEMO_SERVICES[0] | null>(null);
  const [selectedProf, setSelectedProf] = useState<typeof DEMO_PROFESSIONALS[0] | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = () => {
    if (!selectedService || !selectedProf || !selectedTime || !clientName || !clientPhone) return;
    setShowSuccess(true);
    // Store demo appointment for admin page
    const demoApt = {
      client: clientName, service: selectedService.name, professional: selectedProf.name,
      time: selectedTime, price: selectedService.price, phone: clientPhone,
    };
    sessionStorage.setItem('demo-appointment', JSON.stringify(demoApt));
    setTimeout(() => navigate('/demo-admin'), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        🚀 Você está no modo demonstração do Klendei
      </div>

      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <KlendeiLogo size="sm" />
          <ThemeToggle />
        </div>
      </header>

      {/* Success overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-4 p-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
              </motion.div>
              <h2 className="text-2xl font-bold">Agendamento realizado com sucesso! 🎉</h2>
              <p className="text-muted-foreground">Redirecionando para o painel do negócio...</p>
              <div className="w-48 h-1 bg-muted rounded-full mx-auto overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3 }} className="h-full bg-primary rounded-full" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Business hero */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="h-40 rounded-xl bg-gradient-to-r from-primary/20 to-primary/5 flex items-end p-6">
            <div>
              <h1 className="text-2xl font-bold">{DEMO_BUSINESS.name}</h1>
              <p className="text-muted-foreground">O melhor salão da cidade — demonstração</p>
            </div>
          </div>
        </motion.div>

        {/* Step 1: Select service */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-bold mb-4">1. Escolha o serviço</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {DEMO_SERVICES.map((svc) => (
              <motion.div key={svc.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Card className={`cursor-pointer transition-colors ${selectedService?.id === svc.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}
                  onClick={() => setSelectedService(svc)}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{svc.name}</p>
                      <p className="text-sm text-muted-foreground">{svc.duration_minutes} min</p>
                    </div>
                    <p className="font-bold text-primary">{formatCurrency(svc.price)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Step 2: Select professional */}
        {selectedService && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-bold mb-4">2. Escolha o profissional</h2>
            <div className="flex gap-4">
              {DEMO_PROFESSIONALS.map((prof) => (
                <motion.div key={prof.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Card className={`cursor-pointer transition-colors ${selectedProf?.id === prof.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}`}
                    onClick={() => setSelectedProf(prof)}>
                    <CardContent className="p-4 text-center">
                      <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <UserCircle className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium text-sm">{prof.name}</p>
                      <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 3: Select time */}
        {selectedProf && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-bold mb-4">3. Escolha o horário</h2>
            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {TIME_SLOTS.map((t) => (
                <motion.button key={t} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedTime === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                  }`}
                  onClick={() => setSelectedTime(t)}>
                  {t}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Client info */}
        {selectedTime && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-bold mb-4">4. Seus dados</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome" />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>

                {/* Summary */}
                <div className="border rounded-lg p-4 bg-muted/50 space-y-1 text-sm">
                  <p><strong>Serviço:</strong> {selectedService?.name} — {formatCurrency(selectedService?.price ?? 0)}</p>
                  <p><strong>Profissional:</strong> {selectedProf?.name}</p>
                  <p><strong>Horário:</strong> Hoje às {selectedTime}</p>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button className="w-full" size="lg" disabled={!clientName || !clientPhone} onClick={handleConfirm}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Confirmar agendamento
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}

export function DemoAdmin() {
  const navigate = useNavigate();
  const [ctaOpen, setCtaOpen] = useState(false);

  const demoAptRaw = sessionStorage.getItem('demo-appointment');
  const demoApt = demoAptRaw ? JSON.parse(demoAptRaw) : null;

  const allAppointments = [
    ...DEMO_EXISTING_APPOINTMENTS,
    ...(demoApt ? [{ id: 'new', client: demoApt.client, service: demoApt.service, professional: demoApt.professional, time: demoApt.time, price: demoApt.price, status: 'pending' as const }] : []),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const allClients = [
    ...DEMO_CLIENTS,
    ...(demoApt ? [{ id: 'cnew', name: demoApt.client, phone: demoApt.phone || '11999000000', total_visits: 1, total_spent: demoApt.price }] : []),
  ];

  const totalRevenue = allAppointments.reduce((s, a) => s + a.price, 0);
  const today = new Date();

  const statCards = [
    { label: 'Agendamentos hoje', value: allAppointments.length, icon: Calendar, color: 'text-primary' },
    { label: 'Confirmados', value: allAppointments.filter(a => a.status === 'confirmed').length, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Pendentes', value: allAppointments.filter(a => a.status === 'pending').length, icon: Clock, color: 'text-yellow-500' },
    { label: 'Receita estimada', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Demo banner */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
        🚀 Você está no modo demonstração do Klendei — Painel administrativo
      </div>

      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <KlendeiLogo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="outline" size="sm" onClick={() => navigate('/demo')}>Ver página pública</Button>
            </motion.div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Painel — {DEMO_BUSINESS.name}</h1>
            <p className="text-muted-foreground capitalize">{format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card>
                <CardContent className="p-4">
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                  <p className="text-2xl font-bold mt-2">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Today's appointments */}
        <Card>
          <CardHeader><CardTitle className="text-base">Agenda de hoje</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allAppointments.map((apt, i) => {
                const isNew = apt.id === 'new';
                return (
                  <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${isNew ? 'border-primary/50 bg-primary/5 shadow-[0_0_12px_rgba(124,110,245,0.15)]' : ''}`}>
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold">{apt.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{apt.client}</p>
                        {isNew && <Badge className="bg-primary text-primary-foreground text-[10px]">Novo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{apt.service} · {apt.professional}</p>
                    </div>
                    <Badge variant="outline" className={STATUS_MAP[apt.status]?.className}>
                      {STATUS_MAP[apt.status]?.label}
                    </Badge>
                    <p className="text-sm font-medium">{formatCurrency(apt.price)}</p>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Clients */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Clientes</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {allClients.map((c) => {
                const isNew = c.id === 'cnew';
                return (
                  <div key={c.id} className={`flex items-center gap-4 p-3 rounded-lg border ${isNew ? 'border-primary/50 bg-primary/5' : ''}`}>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{c.name}</p>
                        {isNew && <Badge className="bg-primary text-primary-foreground text-[10px]">Novo</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <p className="text-sm">{c.total_visits} visitas</p>
                    <p className="text-sm font-medium">{formatCurrency(c.total_spent)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Scissors className="h-4 w-4" /> Serviços</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DEMO_SERVICES.map((svc) => (
                <div key={svc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Scissors className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{svc.name}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(svc.price)} · {svc.duration_minutes} min</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center space-y-4">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <h2 className="text-xl font-bold">Gostou do que viu?</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Tenha tudo isso no seu negócio. Configuração rápida e personalizada para o seu salão ou clínica.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" onClick={() => setCtaOpen(true)}>
                    <Instagram className="mr-2 h-5 w-5" /> Quero isso no meu negócio
                  </Button>
                </motion.div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mt-4">
                <p>⚡ Ativação rápida e personalizada</p>
                <p>📲 Fale com a gente: @klendei</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* CTA Modal */}
      <Dialog open={ctaOpen} onOpenChange={setCtaOpen}>
        <DialogContent className="text-center">
          <DialogHeader><DialogTitle>💬 Ative no seu negócio</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">Para ativar no seu negócio, fale com a gente no Instagram <strong>@klendei</strong></p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" onClick={() => window.open('https://instagram.com/klendei', '_blank')} className="w-full">
                <Instagram className="mr-2 h-5 w-5" /> Ir para o Instagram
              </Button>
            </motion.div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
