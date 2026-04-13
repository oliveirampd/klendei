import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTime } from '@/lib/format';
import { Calendar, Clock, DollarSign, CheckCircle, Plus } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const STATUS_MAP = {
  pending: { label: 'Pendente', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-500' },
  confirmed: { label: 'Confirmado', variant: 'outline' as const, className: 'border-green-500 text-green-500' },
  completed: { label: 'Concluído', variant: 'secondary' as const, className: '' },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, className: '' },
};

export default function DashboardHome() {
  const { business, refetch: refetchBusiness } = useBusiness();
  const today = new Date();

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments', business?.id, format(today, 'yyyy-MM-dd')],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, professional:professionals(name, photo_url), service:services(name, price, duration_minutes), client:clients(name, phone)')
        .eq('business_id', business.id)
        .gte('datetime', startOfDay(today).toISOString())
        .lte('datetime', endOfDay(today).toISOString())
        .order('datetime');
      if (error) throw error;
      return data;
    },
    enabled: !!business,
    refetchInterval: 30000,
  });

  const totalToday = todayAppointments.length;
  const confirmed = todayAppointments.filter((a) => a.status === 'confirmed').length;
  const pending = todayAppointments.filter((a) => a.status === 'pending').length;
  const revenue = todayAppointments
    .filter((a) => a.status !== 'cancelled')
    .reduce((sum, a) => sum + (a.service?.price ?? 0), 0);

  const { data: setupChecklist } = useQuery({
    queryKey: ['setup-checklist', business?.id],
    queryFn: async () => {
      if (!business) return null;
      const { data: professionals } = await supabase
        .from('professionals').select('id').eq('business_id', business.id).limit(1);
      const { data: services } = await supabase
        .from('services').select('id').eq('business_id', business.id).limit(1);
      return {
        hasLogo: !!business.logo_url,
        hasBanner: !!business.banner_url,
        hasProfessional: (professionals?.length ?? 0) > 0,
        hasService: (services?.length ?? 0) > 0,
      };
    },
    enabled: !!business && !business.onboarding_completed,
  });

  useEffect(() => {
    if (setupChecklist && business && !business.onboarding_completed) {
      const allDone = setupChecklist.hasLogo && setupChecklist.hasBanner && setupChecklist.hasProfessional && setupChecklist.hasService;
      if (allDone) {
        supabase.from('businesses').update({ onboarding_completed: true }).eq('id', business.id).then(() => {
          refetchBusiness();
        });
      }
    }
  }, [setupChecklist, business]);

  const showChecklist = setupChecklist && !business?.onboarding_completed &&
    !(setupChecklist.hasLogo && setupChecklist.hasBanner && setupChecklist.hasProfessional && setupChecklist.hasService);

  const statCards = [
    { label: 'Agendamentos hoje', value: totalToday, icon: Calendar, color: 'text-primary' },
    { label: 'Confirmados', value: confirmed, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Pendentes', value: pending, icon: Clock, color: 'text-yellow-500' },
    { label: 'Receita estimada', value: formatCurrency(revenue), icon: DollarSign, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Business header with logo/banner */}
      {business && (business.banner_url || business.logo_url) && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-xl overflow-hidden">
          {business.banner_url ? (
            <img src={business.banner_url} alt="Capa" className="w-full h-40 object-cover" />
          ) : (
            <div className="w-full h-40 bg-gradient-to-r from-primary/20 to-primary/5" />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4 flex items-end gap-4">
            {business.logo_url && (
              <img src={business.logo_url} alt={business.name} className="h-16 w-16 rounded-xl object-cover border-2 border-background shadow-lg" />
            )}
            <div>
              <h2 className="text-lg font-bold text-foreground">{business.name}</h2>
              {business.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">{business.description}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Início</h1>
          <p className="text-muted-foreground capitalize">
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button asChild>
            <Link to="/dashboard/novo-agendamento">
              <Plus className="mr-2 h-4 w-4" />Novo agendamento
            </Link>
          </Button>
        </motion.div>
      </div>

      {showChecklist && (
        <Card className="border-primary/30 bg-accent/50">
          <CardHeader className="pb-3"><CardTitle className="text-base">Configure seu negócio</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {[
              { done: setupChecklist.hasLogo, label: 'Adicionar logo', link: '/dashboard/personalizacao' },
              { done: setupChecklist.hasBanner, label: 'Adicionar foto de capa', link: '/dashboard/personalizacao' },
              { done: setupChecklist.hasProfessional, label: 'Adicionar primeiro profissional', link: '/dashboard/profissionais' },
              { done: setupChecklist.hasService, label: 'Adicionar primeiro serviço', link: '/dashboard/servicos' },
            ].map((item) => (
              <Link key={item.label} to={item.link}
                className={`flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-accent transition-colors ${item.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                <CheckCircle className={`h-4 w-4 ${item.done ? 'text-green-500' : 'text-muted-foreground'}`} />
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
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

      {/* Today timeline */}
      <Card>
        <CardHeader><CardTitle className="text-base">Agenda de hoje</CardTitle></CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento para hoje.</p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="mt-4">
                <Button variant="outline" asChild>
                  <Link to="/dashboard/novo-agendamento">
                    <Plus className="mr-2 h-4 w-4" />Agendar agora
                  </Link>
                </Button>
              </motion.div>
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt, i) => {
                const status = STATUS_MAP[apt.status as keyof typeof STATUS_MAP];
                return (
                  <motion.div key={apt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold">{formatTime(apt.datetime)}</p>
                    </div>
                    {apt.professional?.photo_url && (
                      <img src={apt.professional.photo_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{apt.client?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{apt.service?.name} · {apt.professional?.name}</p>
                    </div>
                    <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
                    <p className="text-sm font-medium">{formatCurrency(apt.service?.price ?? 0)}</p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
