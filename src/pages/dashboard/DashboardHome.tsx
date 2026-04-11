import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatTime } from '@/lib/format';
import { Calendar, Clock, DollarSign, Users, Plus, CheckCircle } from 'lucide-react';
import { startOfDay, endOfDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const STATUS_MAP = {
  pending: { label: 'Pendente', variant: 'outline' as const, className: 'border-warning text-warning' },
  confirmed: { label: 'Confirmado', variant: 'outline' as const, className: 'border-success text-success' },
  completed: { label: 'Concluído', variant: 'secondary' as const, className: '' },
  cancelled: { label: 'Cancelado', variant: 'destructive' as const, className: '' },
};

export default function DashboardHome() {
  const { business } = useBusiness();
  const today = new Date();

  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['today-appointments', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, professional:professionals(name), service:services(name, price, duration_minutes), client:clients(name, phone)')
        .eq('business_id', business.id)
        .gte('datetime', startOfDay(today).toISOString())
        .lte('datetime', endOfDay(today).toISOString())
        .order('datetime');
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

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
        .from('professionals')
        .select('id')
        .eq('business_id', business.id)
        .limit(1);
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('business_id', business.id)
        .limit(1);
      return {
        hasLogo: !!business.logo_url,
        hasBanner: !!business.banner_url,
        hasProfessional: (professionals?.length ?? 0) > 0,
        hasService: (services?.length ?? 0) > 0,
      };
    },
    enabled: !!business && !business.onboarding_completed,
  });

  const showChecklist = setupChecklist && !business?.onboarding_completed;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Início</h1>
          <p className="text-muted-foreground capitalize">
            {format(today, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/dashboard/agenda">
              <Plus className="mr-2 h-4 w-4" />
              Novo agendamento
            </Link>
          </Button>
        </div>
      </div>

      {showChecklist && (
        <Card className="border-primary/30 bg-accent/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configure seu negócio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { done: setupChecklist.hasLogo, label: 'Adicionar logo', link: '/dashboard/personalizacao' },
              { done: setupChecklist.hasBanner, label: 'Adicionar foto de capa', link: '/dashboard/personalizacao' },
              { done: setupChecklist.hasProfessional, label: 'Adicionar primeiro profissional', link: '/dashboard/profissionais' },
              { done: setupChecklist.hasService, label: 'Adicionar primeiro serviço', link: '/dashboard/servicos' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.link}
                className={`flex items-center gap-2 text-sm p-2 rounded-lg hover:bg-accent transition-colors ${
                  item.done ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                <CheckCircle className={`h-4 w-4 ${item.done ? 'text-success' : 'text-muted-foreground'}`} />
                {item.label}
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Agendamentos', value: todayAppointments.length, icon: Calendar },
          { label: 'Confirmados', value: confirmed, icon: CheckCircle },
          { label: 'Pendentes', value: pending, icon: Clock },
          { label: 'Receita estimada', value: formatCurrency(revenue), icon: DollarSign },
        ].map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Agenda de hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum agendamento para hoje.
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => {
                const status = STATUS_MAP[apt.status];
                return (
                  <div
                    key={apt.id}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-center min-w-[50px]">
                      <p className="text-sm font-bold">{formatTime(apt.datetime)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{apt.client?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.service?.name} · {apt.professional?.name}
                      </p>
                    </div>
                    <Badge variant={status.variant} className={status.className}>
                      {status.label}
                    </Badge>
                    <p className="text-sm font-medium">
                      {formatCurrency(apt.service?.price ?? 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
