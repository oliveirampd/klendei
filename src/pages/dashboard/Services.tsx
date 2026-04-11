import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Scissors, Sparkles, Hand, Eye, Droplets, Stethoscope, Smile, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SERVICE_ICONS: Record<string, any> = {
  scissors: Scissors,
  sparkles: Sparkles,
  hand: Hand,
  eye: Eye,
  droplets: Droplets,
  stethoscope: Stethoscope,
  smile: Smile,
  heart: Heart,
};

const ICON_OPTIONS = Object.keys(SERVICE_ICONS);

function getServiceIcon(iconKey?: string | null) {
  if (iconKey && SERVICE_ICONS[iconKey]) return SERVICE_ICONS[iconKey];
  return Scissors;
}

export default function Services() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [iconKey, setIconKey] = useState('scissors');

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
        icon_key: iconKey,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setName('');
      setPrice('');
      setDuration('30');
      setIconKey('scissors');
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
            <Button className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]">
              <Plus className="mr-2 h-4 w-4" />Adicionar
            </Button>
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
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map((key) => {
                    const Icon = SERVICE_ICONS[key];
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIconKey(key)}
                        className={`p-2 rounded-lg border transition-colors ${
                          iconKey === key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!name || !price || addMutation.isPending} className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]">
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
          {services.map((svc, i) => {
            const Icon = getServiceIcon(svc.icon_key);
            return (
              <motion.div key={svc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{svc.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatCurrency(svc.price)}</span>
                          <span>·</span>
                          <span>{svc.duration_minutes} min</span>
                        </div>
                      </div>
                      <Button
                        variant={svc.active ? 'default' : 'secondary'}
                        size="sm"
                        onClick={() => toggleActive.mutate({ id: svc.id, active: svc.active ?? true })}
                        className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
                      >
                        {svc.active ? 'Ativo' : 'Inativo'}
                      </Button>
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
