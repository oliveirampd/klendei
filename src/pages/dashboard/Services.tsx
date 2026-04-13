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
  scissors: Scissors, sparkles: Sparkles, hand: Hand, eye: Eye,
  droplets: Droplets, stethoscope: Stethoscope, smile: Smile, heart: Heart,
};
const ICON_OPTIONS = Object.keys(SERVICE_ICONS);

function getServiceIcon(iconKey?: string | null) {
  if (iconKey && SERVICE_ICONS[iconKey]) return SERVICE_ICONS[iconKey];
  return Scissors;
}

const SALON_TEMPLATES = [
  { name: 'Corte feminino', price: 80, duration: 45, icon: 'scissors' },
  { name: 'Corte masculino', price: 50, duration: 30, icon: 'scissors' },
  { name: 'Coloração completa', price: 220, duration: 150, icon: 'droplets' },
  { name: 'Escova progressiva', price: 350, duration: 180, icon: 'sparkles' },
  { name: 'Hidratação', price: 120, duration: 60, icon: 'droplets' },
  { name: 'Manicure', price: 45, duration: 45, icon: 'hand' },
  { name: 'Pedicure', price: 55, duration: 50, icon: 'hand' },
  { name: 'Sobrancelha', price: 35, duration: 30, icon: 'eye' },
  { name: 'Barba', price: 40, duration: 30, icon: 'scissors' },
  { name: 'Luzes / Mechas', price: 280, duration: 180, icon: 'sparkles' },
];

const CLINIC_TEMPLATES = [
  { name: 'Consulta inicial', price: 200, duration: 60, icon: 'stethoscope' },
  { name: 'Retorno', price: 120, duration: 30, icon: 'stethoscope' },
  { name: 'Avaliação', price: 150, duration: 45, icon: 'heart' },
  { name: 'Limpeza de pele', price: 180, duration: 60, icon: 'smile' },
  { name: 'Drenagem linfática', price: 130, duration: 60, icon: 'hand' },
];

export default function Services() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');
  const [iconKey, setIconKey] = useState('scissors');

  const templates = business?.type === 'clinic' ? CLINIC_TEMPLATES : SALON_TEMPLATES;

  const { data: services = [] } = useQuery({
    queryKey: ['services', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase.from('services').select('*').eq('business_id', business.id).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const addMutation = useMutation({
    mutationFn: async (svc: { name: string; price: number; duration: number; icon: string }) => {
      if (!business) throw new Error('No business');
      const { error } = await supabase.from('services').insert({
        business_id: business.id,
        name: svc.name,
        price: svc.price,
        duration_minutes: svc.duration,
        icon_key: svc.icon,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setOpen(false);
      setName(''); setPrice(''); setDuration('30'); setIconKey('scissors');
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

  const handleAddCustom = () => {
    if (!name || !price) return;
    addMutation.mutate({ name, price: parseFloat(price.replace(',', '.')), duration: parseInt(duration), icon: iconKey });
  };

  const handleAddTemplate = (t: typeof templates[0]) => {
    addMutation.mutate({ name: t.name, price: t.price, duration: t.duration, icon: t.icon });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo serviço</DialogTitle></DialogHeader>
            <div className="space-y-5">
              {/* Templates */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Escolha um modelo ou crie personalizado</Label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((t) => {
                    const Icon = SERVICE_ICONS[t.icon] || Scissors;
                    const alreadyExists = services.some(s => s.name === t.name);
                    return (
                      <motion.button key={t.name} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        disabled={alreadyExists || addMutation.isPending}
                        onClick={() => handleAddTemplate(t)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${alreadyExists ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/10 hover:border-primary/50'}`}>
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{t.name}</span>
                        <span className="text-muted-foreground">R${t.price}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou crie personalizado</span></div></div>

              {/* Custom form */}
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
                        <motion.button key={key} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setIconKey(key)}
                          className={`p-2 rounded-lg border transition-colors ${iconKey === key ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}>
                          <Icon className="h-5 w-5" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={handleAddCustom} disabled={!name || !price || addMutation.isPending} className="w-full">
                    {addMutation.isPending ? 'Salvando...' : 'Adicionar'}
                  </Button>
                </motion.div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado.</p>
            <p className="text-sm text-muted-foreground">Clique em "Adicionar" para escolher modelos pré-prontos ou criar o seu.</p>
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
                          <span>{formatCurrency(svc.price)}</span><span>·</span><span>{svc.duration_minutes} min</span>
                        </div>
                      </div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button variant={svc.active ? 'default' : 'secondary'} size="sm"
                          onClick={() => toggleActive.mutate({ id: svc.id, active: svc.active ?? true })}>
                          {svc.active ? 'Ativo' : 'Inativo'}
                        </Button>
                      </motion.div>
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
