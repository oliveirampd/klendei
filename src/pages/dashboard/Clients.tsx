import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency, formatDate, formatPhone, phoneToWhatsApp, phoneMask } from '@/lib/format';
import { Search, UserCircle, MessageCircle, Calendar, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Clients() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'returning' | 'inactive'>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', business.id)
        .order('last_visit', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  const { data: clientAppointments = [] } = useQuery({
    queryKey: ['client-appointments', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const { data, error } = await supabase
        .from('appointments')
        .select('*, professional:professionals(name), service:services(name, price)')
        .eq('client_id', selectedClientId)
        .order('datetime', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientId,
  });

  const updateClientMutation = useMutation({
    mutationFn: async (client: { id: string; name: string; phone: string; notes: string | null }) => {
      const { id, ...rest } = client;
      const { error } = await supabase.from('clients').update({ ...rest, phone: rest.phone.replace(/\D/g, '') }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setEditOpen(false);
      toast.success('Cliente atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar cliente.'),
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setSelectedClientId(null);
      toast.success('Cliente removido!');
    },
    onError: () => toast.error('Erro ao remover cliente.'),
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search.replace(/\D/g, ''));
    if (!matchesSearch) return false;
    if (filter === 'new') return (c.total_visits ?? 0) <= 1;
    if (filter === 'returning') return (c.total_visits ?? 0) > 1;
    if (filter === 'inactive')
      return c.last_visit && differenceInDays(new Date(), new Date(c.last_visit)) > 60;
    return true;
  });

  const openEdit = (client: any) => {
    setEditingClient({ ...client, phone: formatPhone(client.phone) });
    setEditOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Deseja remover o cliente "${name}"?`)) {
      deleteClientMutation.mutate(id);
    }
  };

  if (selectedClient) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => setSelectedClientId(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <div className="flex-1" />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" onClick={() => openEdit(selectedClient)}>
              <Pencil className="mr-2 h-3 w-3" /> Editar
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive"
              onClick={() => handleDelete(selectedClient.id, selectedClient.name)}>
              <Trash2 className="mr-2 h-3 w-3" /> Excluir
            </Button>
          </motion.div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{selectedClient.name}</h1>
            <div className="flex items-center gap-2">
              <p className="text-muted-foreground">{formatPhone(selectedClient.phone)}</p>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => window.open(phoneToWhatsApp(selectedClient.phone), '_blank')}
                className="text-green-500 hover:text-green-400">
                <MessageCircle className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="sm" variant="outline"
              onClick={() => window.open(phoneToWhatsApp(selectedClient.phone), '_blank')}>
              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
            </Button>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{selectedClient.total_visits ?? 0}</p>
            <p className="text-xs text-muted-foreground">Visitas</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{formatCurrency(selectedClient.total_spent ?? 0)}</p>
            <p className="text-xs text-muted-foreground">Total gasto</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{selectedClient.last_visit ? formatDate(selectedClient.last_visit) : '—'}</p>
            <p className="text-xs text-muted-foreground">Última visita</p>
          </CardContent></Card>
        </div>

        {selectedClient.notes && (
          <Card><CardContent className="p-4">
            <p className="text-sm text-muted-foreground"><strong>Notas:</strong> {selectedClient.notes}</p>
          </CardContent></Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Histórico de agendamentos</CardTitle></CardHeader>
          <CardContent>
            {clientAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum agendamento encontrado.</p>
            ) : (
              <div className="space-y-3">
                {clientAppointments.map((apt) => (
                  <motion.div key={apt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-4 p-3 rounded-lg border">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{apt.service?.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(apt.datetime)} · {apt.professional?.name}</p>
                    </div>
                    <Badge variant={apt.status === 'completed' ? 'secondary' : 'outline'}>
                      {apt.status === 'pending' ? 'Pendente' : apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'completed' ? 'Concluído' : 'Cancelado'}
                    </Badge>
                    <p className="text-sm font-medium">{formatCurrency(apt.service?.price ?? 0)}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Clientes</h1>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar cliente</DialogTitle></DialogHeader>
          {editingClient && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editingClient.name} onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={editingClient.phone} onChange={(e) => setEditingClient({ ...editingClient, phone: phoneMask(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Notas (privado)</Label>
                <Input value={editingClient.notes || ''} onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })} placeholder="Observações sobre o cliente" />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={() => updateClientMutation.mutate(editingClient)} disabled={updateClientMutation.isPending} className="w-full">
                  {updateClientMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
                </Button>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou telefone..." className="pl-10" />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all' as const, label: 'Todos' },
            { key: 'new' as const, label: 'Novos' },
            { key: 'returning' as const, label: 'Recorrentes' },
            { key: 'inactive' as const, label: 'Inativos' },
          ].map((f) => (
            <motion.div key={f.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant={filter === f.key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f.key)}>
                {f.label}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredClients.map((client) => {
            const isInactive = client.last_visit && differenceInDays(new Date(), new Date(client.last_visit)) > 60;
            return (
              <motion.div key={client.id} whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.995 }}>
                <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setSelectedClientId(client.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{client.name}</p>
                          {isInactive && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{formatPhone(client.phone)}</p>
                          <motion.button whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); window.open(phoneToWhatsApp(client.phone), '_blank'); }}
                            className="text-green-500 hover:text-green-400">
                            <MessageCircle className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{client.total_visits ?? 0} visitas</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(client.total_spent ?? 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
