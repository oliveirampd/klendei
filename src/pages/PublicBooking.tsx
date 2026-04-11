import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, phoneMask, phoneToWhatsApp } from '@/lib/format';
import { format, addDays, startOfDay, setHours, setMinutes, isBefore, isAfter, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MessageCircle, Clock, Check, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Professional = Tables<'professionals'>;
type Service = Tables<'services'>;

export default function PublicBooking() {
  const { slug } = useParams<{ slug: string }>();
  const [step, setStep] = useState(0); // 0=browse, 1=pick time, 2=info, 3=done
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingDone, setBookingDone] = useState(false);
  const [bookedInfo, setBookedInfo] = useState<{ professional: string; service: string; date: string; time: string } | null>(null);

  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ['public-business', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['public-professionals', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('business_id', business!.id)
        .eq('active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['public-services', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', business!.id)
        .eq('active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const { data: existingAppointments = [] } = useQuery({
    queryKey: ['public-appointments', business?.id, selectedDate.toISOString(), selectedProfessionalId],
    queryFn: async () => {
      if (!business) return [];
      let query = supabase
        .from('appointments')
        .select('datetime, service:services(duration_minutes), professional_id')
        .eq('business_id', business.id)
        .gte('datetime', startOfDay(selectedDate).toISOString())
        .lt('datetime', startOfDay(addDays(selectedDate, 1)).toISOString())
        .neq('status', 'cancelled');
      if (selectedProfessionalId) {
        query = query.eq('professional_id', selectedProfessionalId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!business && step === 1,
  });

  const themeColor = business?.theme_color || '#7C6EF5';

  // Generate time slots
  const timeSlots = useMemo(() => {
    if (!business || !selectedService) return [];
    const hours = business.hours as Record<string, { open: string; close: string; closed: boolean }> | null;
    if (!hours) return [];

    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = dayKeys[selectedDate.getDay()];
    const dayHours = hours[dayKey];
    if (!dayHours || dayHours.closed) return [];

    const [openH, openM] = dayHours.open.split(':').map(Number);
    const [closeH, closeM] = dayHours.close.split(':').map(Number);

    const slots: string[] = [];
    let current = setMinutes(setHours(selectedDate, openH), openM);
    const end = setMinutes(setHours(selectedDate, closeH), closeM);
    const now = new Date();

    while (isBefore(current, end)) {
      const slotEnd = addMinutes(current, selectedService.duration_minutes);
      if (isAfter(slotEnd, end)) break;
      if (isAfter(current, now) || !isBefore(selectedDate, startOfDay(now))) {
        // Check if slot conflicts with existing appointments
        const slotTime = current.toISOString();
        const conflict = existingAppointments.some((apt) => {
          const aptStart = new Date(apt.datetime);
          const aptEnd = addMinutes(aptStart, apt.service?.duration_minutes ?? 30);
          return isBefore(current, aptEnd) && isAfter(slotEnd, aptStart);
        });
        slots.push(format(current, 'HH:mm'));
        if (conflict) {
          // We'll mark it but still include it
        }
      }
      current = addMinutes(current, 30); // 30-min intervals
    }
    return slots;
  }, [business, selectedService, selectedDate, existingAppointments]);

  const takenSlots = useMemo(() => {
    return new Set(existingAppointments.map((apt) => format(new Date(apt.datetime), 'HH:mm')));
  }, [existingAppointments]);

  // Calendar days
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 14; i++) {
      days.push(addDays(startOfDay(new Date()), i));
    }
    return days;
  }, []);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!business || !selectedService || !selectedTime) throw new Error('Missing data');

      const [h, m] = selectedTime.split(':').map(Number);
      const datetime = setMinutes(setHours(selectedDate, h), m);

      // Find or create client
      const phone = clientPhone.replace(/\D/g, '');
      let { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('business_id', business.id)
        .eq('phone', phone)
        .maybeSingle();

      let clientId: string;
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('clients')
          .insert({
            business_id: business.id,
            name: clientName,
            phone,
            first_visit: datetime.toISOString(),
          })
          .select('id')
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      // Assign professional
      const profId = selectedProfessionalId || professionals[0]?.id;
      if (!profId) throw new Error('No professional available');

      const { error } = await supabase.from('appointments').insert({
        business_id: business.id,
        professional_id: profId,
        service_id: selectedService.id,
        client_id: clientId,
        datetime: datetime.toISOString(),
        notes: notes || null,
      });
      if (error) throw error;

      const prof = professionals.find(p => p.id === profId);
      setBookedInfo({
        professional: prof?.name || '',
        service: selectedService.name,
        date: format(datetime, "dd/MM/yyyy", { locale: ptBR }),
        time: selectedTime,
      });
    },
    onSuccess: () => {
      setBookingDone(true);
      setStep(3);
    },
    onError: () => toast.error('Erro ao agendar. Tente novamente.'),
  });

  if (businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Página não encontrada</h1>
          <p className="text-muted-foreground">Este negócio não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (step === 3 && bookingDone && bookedInfo) {
    const whatsappMsg = encodeURIComponent(
      `Olá! Confirmando meu agendamento: ${bookedInfo.service} com ${bookedInfo.professional} em ${bookedInfo.date} às ${bookedInfo.time} no ${business.name}.`
    );
    const whatsappUrl = business.whatsapp
      ? `https://wa.me/55${business.whatsapp}?text=${whatsappMsg}`
      : null;

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F7F6F2' }}>
        <div className="w-full max-w-md text-center animate-scale-in">
          <div
            className="h-20 w-20 rounded-full mx-auto flex items-center justify-center mb-6 animate-check-bounce"
            style={{ backgroundColor: themeColor }}
          >
            <Check className="h-10 w-10" style={{ color: '#fff' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2">Tudo certo, {clientName}!</h1>
          <p className="text-muted-foreground mb-6">Seu agendamento foi realizado com sucesso.</p>

          <Card className="mb-6 text-left">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium">{bookedInfo.service}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profissional</span>
                <span className="font-medium">{bookedInfo.professional}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">{bookedInfo.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium">{bookedInfo.time}</span>
              </div>
            </CardContent>
          </Card>

          {whatsappUrl && (
            <Button
              className="w-full mb-3"
              style={{ backgroundColor: '#25D366' }}
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Confirmar via WhatsApp
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep(0);
              setBookingDone(false);
              setSelectedService(null);
              setSelectedTime(null);
              setClientName('');
              setClientPhone('');
              setNotes('');
            }}
          >
            Voltar ao início
          </Button>
        </div>
      </div>
    );
  }

  // Step 2: Client Info
  if (step === 2) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ backgroundColor: '#F7F6F2' }}>
        <div className="max-w-md mx-auto animate-fade-in">
          {/* Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map((s) => (
              <div key={s} className="h-2 w-12 rounded-full" style={{ backgroundColor: s <= 2 ? themeColor : '#e5e5e5' }} />
            ))}
          </div>

          <Button variant="ghost" onClick={() => setStep(1)} className="mb-4">
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>

          <h2 className="text-xl font-bold mb-6">Seus dados</h2>

          <Card className="mb-6">
            <CardContent className="p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço</span>
                <span className="font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data</span>
                <span className="font-medium">{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor</span>
                <span className="font-medium">{formatCurrency(selectedService?.price ?? 0)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome completo *</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label>WhatsApp *</Label>
              <Input
                value={clientPhone}
                onChange={(e) => setClientPhone(phoneMask(e.target.value))}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label>Alguma observação?</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" rows={3} />
            </div>
            <p className="text-xs text-muted-foreground">
              Seus dados são usados só para este agendamento.
            </p>
            <Button
              className="w-full"
              style={{ backgroundColor: themeColor }}
              disabled={!clientName || clientPhone.replace(/\D/g, '').length < 10 || bookMutation.isPending}
              onClick={() => bookMutation.mutate()}
            >
              {bookMutation.isPending ? 'Agendando...' : 'Confirmar agendamento'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: Pick date/time
  if (step === 1 && selectedService) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ backgroundColor: '#F7F6F2' }}>
        <div className="max-w-md mx-auto animate-fade-in">
          {/* Progress */}
          <div className="flex justify-center gap-2 mb-8">
            {[0, 1, 2].map((s) => (
              <div key={s} className="h-2 w-12 rounded-full" style={{ backgroundColor: s <= 1 ? themeColor : '#e5e5e5' }} />
            ))}
          </div>

          <Button variant="ghost" onClick={() => setStep(0)} className="mb-4">
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>

          <h2 className="text-xl font-bold mb-2">{selectedService.name}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {selectedService.duration_minutes} min · {formatCurrency(selectedService.price)}
          </p>

          {/* Professional selector */}
          {professionals.length > 1 && (
            <div className="mb-6">
              <Label className="mb-2 block">Profissional</Label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedProfessionalId(null)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-colors ${
                    !selectedProfessionalId ? 'border-2' : 'border-border'
                  }`}
                  style={!selectedProfessionalId ? { borderColor: themeColor, color: themeColor } : {}}
                >
                  Qualquer disponível
                </button>
                {professionals.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfessionalId(prof.id)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-colors ${
                      selectedProfessionalId === prof.id ? 'border-2' : 'border-border'
                    }`}
                    style={selectedProfessionalId === prof.id ? { borderColor: themeColor, color: themeColor } : {}}
                  >
                    {prof.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date picker */}
          <Label className="mb-2 block">Data</Label>
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            {calendarDays.map((day) => {
              const isSelected = day.getTime() === selectedDate.getTime();
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                  className={`shrink-0 flex flex-col items-center p-3 rounded-xl border-2 min-w-[60px] transition-colors ${
                    isSelected ? '' : 'border-border hover:border-muted-foreground/30'
                  }`}
                  style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}15` } : {}}
                >
                  <span className="text-xs text-muted-foreground capitalize">
                    {format(day, 'EEE', { locale: ptBR })}
                  </span>
                  <span className="text-lg font-bold">{format(day, 'dd')}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {format(day, 'MMM', { locale: ptBR })}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          <Label className="mb-2 block">Horário</Label>
          {timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Sem horários disponíveis nesta data.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 mb-6">
              {timeSlots.map((time) => {
                const taken = takenSlots.has(time);
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => !taken && setSelectedTime(time)}
                    disabled={taken}
                    className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                      taken
                        ? 'bg-muted text-muted-foreground cursor-not-allowed border-transparent'
                        : isSelected
                        ? 'border-2'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                    style={isSelected ? { borderColor: themeColor, backgroundColor: `${themeColor}15`, color: themeColor } : {}}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}

          <Button
            className="w-full"
            style={{ backgroundColor: themeColor }}
            disabled={!selectedTime}
            onClick={() => setStep(2)}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  // Step 0: Browse page
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b bg-card">
        <span className="text-sm font-bold" style={{ color: themeColor }}>Klendei</span>
        <span className="text-sm font-medium">{business.name}</span>
        <div />
      </div>

      {/* Hero */}
      <div className="relative">
        {business.banner_url ? (
          <img src={business.banner_url} alt="" className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48" style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}88)` }} />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-end gap-3">
            {business.logo_url && (
              <img src={business.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover border-2 border-card" />
            )}
            <div>
              <h1 className="text-xl font-bold" style={{ color: '#fff' }}>{business.name}</h1>
              {business.description && (
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{business.description}</p>
              )}
              <Badge variant="secondary" className="mt-1">
                {business.type === 'salon' ? 'Salão de beleza' : 'Clínica / Consultório'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Professionals */}
        {professionals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Profissionais</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {professionals.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => setSelectedProfessionalId(
                    selectedProfessionalId === prof.id ? null : prof.id
                  )}
                  className={`flex flex-col items-center shrink-0 ${
                    selectedProfessionalId === prof.id ? 'opacity-100' : 'opacity-70'
                  }`}
                >
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mb-1 border-2"
                    style={{
                      borderColor: selectedProfessionalId === prof.id ? themeColor : 'transparent',
                    }}
                  >
                    {prof.photo_url ? (
                      <img src={prof.photo_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-7 w-7 text-primary" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium truncate max-w-[80px]">{prof.name}</span>
                  {prof.specialty && (
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">{prof.specialty}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Serviços</h2>
        <div className="space-y-3">
          {services.map((svc) => (
            <Card key={svc.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{svc.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{svc.duration_minutes} min</span>
                      <span>·</span>
                      <span className="font-medium text-foreground">{formatCurrency(svc.price)}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    style={{ backgroundColor: themeColor }}
                    onClick={() => {
                      setSelectedService(svc);
                      setStep(1);
                      setSelectedTime(null);
                    }}
                  >
                    Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum serviço disponível no momento.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-6 px-4 text-center space-y-3">
        {business.whatsapp && (
          <Button
            variant="outline"
            onClick={() => window.open(phoneToWhatsApp(business.whatsapp!), '_blank')}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Contato via WhatsApp
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Agendado com{' '}
          <a href="/" className="font-medium hover:underline" style={{ color: themeColor }}>
            Klendei
          </a>
        </p>
      </div>
    </div>
  );
}
