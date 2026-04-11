import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { formatCurrency, formatTime, phoneMask } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { CalendarIcon, Clock, CheckCircle, Search, UserPlus } from 'lucide-react';
import { format, startOfDay, endOfDay, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export default function NewAppointment() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Client selection
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Appointment
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProfId, setSelectedProfId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase.from('clients').select('*').eq('business_id', business.id).order('name');
      return data || [];
    },
    enabled: !!business,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase.from('services').select('*').eq('business_id', business.id).eq('active', true).order('name');
      return data || [];
    },
    enabled: !!business,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase.from('professionals').select('*').eq('business_id', business.id).eq('active', true).order('name');
      return data || [];
    },
    enabled: !!business,
  });

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Fetch existing appointments for selected date + professional to find available slots
  const { data: existingApts = [] } = useQuery({
    queryKey: ['day-appointments', business?.id, selectedProfId, selectedDate?.toISOString()],
    queryFn: async () => {
      if (!business || !selectedDate || !selectedProfId) return [];
      const { data } = await supabase
        .from('appointments')
        .select('*, service:services(duration_minutes)')
        .eq('business_id', business.id)
        .eq('professional_id', selectedProfId)
        .neq('status', 'cancelled')
        .gte('datetime', startOfDay(selectedDate).toISOString())
        .lte('datetime', endOfDay(selectedDate).toISOString());
      return data || [];
    },
    enabled: !!business && !!selectedDate && !!selectedProfId,
  });

  const timeSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    const slots: string[] = [];
    const now = new Date();
    for (let h = 8; h < 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const dt = new Date(selectedDate);
        dt.setHours(h, m, 0, 0);
        if (dt <= now) continue;
        const slotEnd = addMinutes(dt, selectedService.duration_minutes);
        const conflict = existingApts.some((apt: any) => {
          const aptStart = new Date(apt.datetime);
          const aptEnd = addMinutes(aptStart, apt.service?.duration_minutes || 30);
          return dt < aptEnd && slotEnd > aptStart;
        });
        if (!conflict) slots.push(format(dt, 'HH:mm'));
      }
    }
    return slots;
  }, [selectedDate, selectedService, existingApts]);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone.includes(clientSearch.replace(/\D/g, ''))
  );

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!business || !selectedDate || !selectedTime || !selectedServiceId || !selectedProfId) {
        throw new Error('Preencha todos os campos');
      }

      const [hh, mm] = selectedTime.split(':');
      const dt = new Date(selectedDate);
      dt.setHours(parseInt(hh), parseInt(mm), 0, 0);

      let clientName: string;
      let clientPhone: string;

      if (clientMode === 'existing' && selectedClient) {
        clientName = selectedClient.name;
        clientPhone = selectedClient.phone;
      } else if (clientMode === 'new' && newClientName && newClientPhone) {
        clientName = newClientName;
        clientPhone = newClientPhone.replace(/\D/g, '');
      } else {
        throw new Error('Selecione ou crie um cliente');
      }

      const { data, error } = await supabase.functions.invoke('create-appointment', {
        body: {
          business_id: business.id,
          professional_id: selectedProfId,
          service_id: selectedServiceId,
          datetime: dt.toISOString(),
          client_name: clientName,
          client_phone: clientPhone,
          notes: notes || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['agenda-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Agendamento criado com sucesso!');
      navigate('/dashboard/agenda');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Erro ao criar agendamento.');
    },
  });

  const canSubmit =
    selectedServiceId &&
    selectedProfId &&
    selectedDate &&
    selectedTime &&
    ((clientMode === 'existing' && selectedClientId) || (clientMode === 'new' && newClientName && newClientPhone.replace(/\D/g, '').length >= 10));

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Novo Agendamento</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Client Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={clientMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClientMode('existing')}
                  className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Cliente existente
                </Button>
                <Button
                  variant={clientMode === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setClientMode('new')}
                  className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo cliente
                </Button>
              </div>

              {clientMode === 'existing' ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Buscar por nome ou telefone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                  <div className="max-h-48 overflow-auto space-y-1">
                    {filteredClients.map((c) => (
                      <motion.button
                        key={c.id}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                          selectedClientId === c.id ? 'border-primary bg-primary/10' : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedClientId(c.id)}
                      >
                        <p className="font-medium">{c.name}</p>
                        <p className="text-muted-foreground text-xs">{c.phone}</p>
                      </motion.button>
                    ))}
                    {filteredClients.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhum cliente encontrado.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Nome completo</Label>
                    <Input value={newClientName} onChange={(e) => setNewClientName(e.target.value)} placeholder="Nome do cliente" />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp</Label>
                    <Input
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(phoneMask(e.target.value))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Service & Professional */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Serviço e Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {formatCurrency(s.price)} · {s.duration_minutes}min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select value={selectedProfId} onValueChange={setSelectedProfId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} {p.specialty ? `· ${p.specialty}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Alguma observação? (opcional)" rows={2} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Date */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" /> Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { setSelectedDate(d); setSelectedTime(''); }}
                locale={ptBR}
                disabled={(d) => d < startOfDay(new Date())}
                className="rounded-md border mx-auto"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Time */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" /> Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedServiceId || !selectedProfId ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecione um serviço e profissional para ver os horários.
                </p>
              ) : timeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum horário disponível nesta data.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {timeSlots.map((t) => (
                    <motion.button
                      key={t}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        selectedTime === t
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-accent hover:border-primary/30'
                      }`}
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </motion.button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Summary & Submit */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1 text-sm">
                {selectedService && <p><strong>Serviço:</strong> {selectedService.name} — {formatCurrency(selectedService.price)}</p>}
                {selectedProfId && <p><strong>Profissional:</strong> {professionals.find((p) => p.id === selectedProfId)?.name}</p>}
                {selectedDate && selectedTime && (
                  <p><strong>Data:</strong> {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })} às {selectedTime}</p>
                )}
                {clientMode === 'existing' && selectedClient && <p><strong>Cliente:</strong> {selectedClient.name}</p>}
                {clientMode === 'new' && newClientName && <p><strong>Cliente:</strong> {newClientName}</p>}
              </div>
              <Button
                size="lg"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
              >
                {createMutation.isPending ? (
                  'Agendando...'
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar agendamento
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
