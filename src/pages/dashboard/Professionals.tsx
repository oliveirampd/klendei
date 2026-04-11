import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, UserCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Professionals() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error('No business');
      const bookingSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
      const { error } = await supabase.from('professionals').insert({
        business_id: business.id,
        name,
        specialty,
        booking_slug: bookingSlug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setOpen(false);
      setName('');
      setSpecialty('');
      toast.success('Profissional adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar profissional.'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('professionals').update({ active: !active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['professionals'] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo profissional</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Cabeleireira" />
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!name || addMutation.isPending} className="w-full">
                {addMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {professionals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum profissional cadastrado.</p>
            <p className="text-sm text-muted-foreground mt-1">Adicione seu primeiro profissional para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((prof) => (
            <Card key={prof.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{prof.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{prof.specialty || 'Sem especialidade'}</p>
                  </div>
                  <Badge
                    variant={prof.active ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleActive.mutate({ id: prof.id, active: prof.active ?? true })}
                  >
                    {prof.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
