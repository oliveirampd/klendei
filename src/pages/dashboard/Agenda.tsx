import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatTime, formatDate, phoneToWhatsApp } from '@/lib/format';
import { Calendar, ChevronLeft, ChevronRight, Plus, MessageCircle, Trash2 } from 'lucide-react';
import { format, startOfDay, endOfDay, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'outline' | 'secondary' | 'destructive'; className: string }> = {
  pending: { label: 'Pendente', variant: 'outline', className: 'border-yellow-500 text-yellow-600' },
  confirmed: { label: 'Confirmado', variant: 'outline', className: 'border-green-500 text-green-600' },
  completed: { label: 'Concluído', variant: 'secondary', className: '' },
  cancelled: { label: 'Cancelado', variant: 'destructive', className: '' },
};

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8);

export default function Agenda() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [detailApt, setDetailApt] = useState<any>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const rangeStart = view === 'day' ? startOfDay(currentDate) : startOfDay(weekStart);
  const rangeEnd = view === 'day' ? endOfDay(currentDate) : endOfDay(addDays(weekStart, 6));

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data } = await supabase.from('professionals').select('*').eq('business_id', business.id).eq('active', true).order('name');
      return data || [];
    },
    enabled: !!business,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['agenda-appointments', business?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, professional:professionals(name, photo_url), service:services(name, price, duration_minutes), client:clients(name, phone)')
        .eq('business_id', business.id)
        .gte('datetime', rangeStart.toISOString())
        .lte('datetime', rangeEnd.toISOString())
        .order('datetime');
      if (error) throw error;
      return data || [];
    },
    enabled: !!business,
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('appointments').update({ status: status as any }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      setDetailApt(null);
    },
  });

  const deleteApt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      setDetailApt(null);
      toast.success('Agendamento removido!');
    },
    onError: () => toast.error('Erro ao remover.'),
  });

  const getAptsForCell = (profId: string, hour: number, day?: Date) => {
    const targetDay = day || currentDate;
    return appointments.filter((apt: any) => {
      const aptDate = new Date(apt.datetime);
      return apt.professional_id === profId && isSameDay(aptDate, targetDay) && aptDate.getHours() === hour;
    });
  };

  const sendWhatsApp = (apt: any) => {
    if (!apt.client?.phone || !business) return;
    const dateStr = formatDate(apt.datetime);
    const timeStr = formatTime(apt.datetime);
    const msg = `Olá ${apt.client.name}, confirmando seu agendamento de ${apt.service?.name} no dia ${dateStr} às ${timeStr}. Responda SIM ou NÃO. — ${business.name}`;
    window.open(phoneToWhatsApp(apt.client.phone) + `?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const prevDay = () => setCurrentDate((d) => addDays(d, view === 'week' ? -7 : -1));
  const nextDay = () => setCurrentDate((d) => addDays(d, view === 'week' ? 7 : 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
          </motion.div>
          <div className="flex items-center gap-1">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" onClick={prevDay}><ChevronLeft className="h-4 w-4" /></Button>
            </motion.div>
            <span className="text-sm font-medium min-w-[180px] text-center capitalize">
              {view === 'day'
                ? format(currentDate, "EEEE, dd 'de' MMMM", { locale: ptBR })
                : `${format(weekStart, 'dd MMM', { locale: ptBR })} — ${format(addDays(weekStart, 6), 'dd MMM', { locale: ptBR })}`}
            </span>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" onClick={nextDay}><ChevronRight className="h-4 w-4" /></Button>
            </motion.div>
          </div>
          <Select value={view} onValueChange={(v) => setView(v as 'day' | 'week')}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Dia</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
            </SelectContent>
          </Select>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button asChild><Link to="/dashboard/novo-agendamento"><Plus className="mr-2 h-4 w-4" />Novo</Link></Button>
          </motion.div>
        </div>
      </div>

      {professionals.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Adicione profissionais para visualizar a agenda.</p>
        </CardContent></Card>
      ) : view === 'day' ? (
        <DayView professionals={professionals} hours={HOURS} getAptsForCell={getAptsForCell} onClickApt={setDetailApt} />
      ) : (
        <WeekView professionals={professionals} weekDays={weekDays} hours={HOURS} getAptsForCell={getAptsForCell} onClickApt={setDetailApt} />
      )}

      {/* Detail Modal */}
      <Dialog open={!!detailApt} onOpenChange={() => setDetailApt(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes do agendamento</DialogTitle></DialogHeader>
          {detailApt && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <p><strong>Cliente:</strong> {detailApt.client?.name}</p>
                <p><strong>Telefone:</strong> {detailApt.client?.phone}</p>
                <p><strong>Serviço:</strong> {detailApt.service?.name}</p>
                <p><strong>Profissional:</strong> {detailApt.professional?.name}</p>
                <p><strong>Horário:</strong> {formatTime(detailApt.datetime)}</p>
                <p><strong>Data:</strong> {formatDate(detailApt.datetime)}</p>
                <p><strong>Valor:</strong> {formatCurrency(detailApt.service?.price ?? 0)}</p>
                {detailApt.notes && <p><strong>Obs:</strong> {detailApt.notes}</p>}
                <div className="flex items-center gap-2">
                  <strong>Status:</strong>
                  <Badge variant={STATUS_MAP[detailApt.status]?.variant} className={STATUS_MAP[detailApt.status]?.className}>
                    {STATUS_MAP[detailApt.status]?.label}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {detailApt.status === 'pending' && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Button size="sm" onClick={() => updateStatus.mutate({ id: detailApt.id, status: 'confirmed' })}>Confirmar</Button>
                  </motion.div>
                )}
                {(detailApt.status === 'pending' || detailApt.status === 'confirmed') && (
                  <>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Button size="sm" variant="secondary" onClick={() => updateStatus.mutate({ id: detailApt.id, status: 'completed' })}>Concluir</Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                      <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ id: detailApt.id, status: 'cancelled' })}>Cancelar</Button>
                    </motion.div>
                  </>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button size="sm" variant="outline" onClick={() => sendWhatsApp(detailApt)}>
                    <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
                    onClick={() => { if (confirm('Excluir este agendamento?')) deleteApt.mutate(detailApt.id); }}>
                    <Trash2 className="mr-2 h-4 w-4" />Excluir
                  </Button>
                </motion.div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayView({ professionals, hours, getAptsForCell, onClickApt }: any) {
  return (
    <div className="overflow-auto border rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left min-w-[70px] sticky left-0 bg-muted/50 z-10">Horário</th>
            {professionals.map((p: any) => (
              <th key={p.id} className="p-2 text-center min-w-[160px] font-medium">
                <div className="flex flex-col items-center gap-1">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{p.name.charAt(0)}</div>
                  )}
                  <span className="truncate max-w-[140px]">{p.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((h: number) => (
            <tr key={h} className="border-b hover:bg-muted/20 transition-colors">
              <td className="p-2 text-muted-foreground text-xs font-medium sticky left-0 bg-background z-10 border-r">
                {String(h).padStart(2, '0')}:00
              </td>
              {professionals.map((p: any) => {
                const apts = getAptsForCell(p.id, h);
                return (
                  <td key={p.id} className="p-1 border-r min-h-[60px] align-top">
                    {apts.map((apt: any) => (
                      <motion.button key={apt.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={() => onClickApt(apt)}
                        className={`w-full text-left p-2 rounded-md text-xs mb-1 border transition-colors ${
                          apt.status === 'confirmed' ? 'bg-green-500/10 border-green-500/30' :
                          apt.status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/30' :
                          apt.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30' :
                          'bg-muted border-muted-foreground/20'
                        }`}>
                        <p className="font-medium truncate">{apt.client?.name}</p>
                        <p className="text-muted-foreground truncate">{apt.service?.name}</p>
                        <p className="text-muted-foreground">{formatTime(apt.datetime)}</p>
                      </motion.button>
                    ))}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeekView({ professionals, weekDays, hours, getAptsForCell, onClickApt }: any) {
  return (
    <div className="space-y-4">
      {weekDays.map((day: Date) => {
        const dayApts = professionals.flatMap((p: any) =>
          hours.flatMap((h: number) => getAptsForCell(p.id, h, day))
        );
        if (dayApts.length === 0) return null;
        return (
          <motion.div key={day.toISOString()} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm capitalize">{format(day, "EEEE, dd/MM", { locale: ptBR })}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dayApts.map((apt: any) => {
                    const st = STATUS_MAP[apt.status];
                    return (
                      <motion.button key={apt.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={() => onClickApt(apt)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <span className="text-sm font-bold min-w-[45px]">{formatTime(apt.datetime)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{apt.client?.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{apt.service?.name} · {apt.professional?.name}</p>
                        </div>
                        <Badge variant={st.variant} className={st.className}>{st.label}</Badge>
                        <span className="text-sm font-medium">{formatCurrency(apt.service?.price ?? 0)}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
