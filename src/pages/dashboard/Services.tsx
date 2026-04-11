import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Scissors } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export default function Services() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase
        .from('services')
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
      const { error } = await supabase.from('services').insert({
        business_id: business.id,
        name,
        price: parseFloat(price.replace(',', '.')),
        duration_minutes: parseInt(duration),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setName('');
      setPrice('');
      setDuration('30');
      toast.success('Serviço adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar serviço.'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('services').update({ active: !active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo serviço</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Corte feminino" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="50,00" />
                </div>
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!name || !price || addMutation.isPending} className="w-full">
                {addMutation.isPending ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum serviço cadastrado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => (
            <Card key={svc.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{svc.name}</p>
                  <Badge
                    variant={svc.active ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleActive.mutate({ id: svc.id, active: svc.active ?? true })}
                  >
                    {svc.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatCurrency(svc.price)}</span>
                  <span>·</span>
                  <span>{svc.duration_minutes} min</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
