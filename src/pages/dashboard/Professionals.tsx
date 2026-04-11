import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, UserCircle, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SPECIALTIES = [
  'Cabeleireiro(a)', 'Barbeiro', 'Manicure', 'Pedicure', 'Esteticista',
  'Maquiador(a)', 'Designer de sobrancelhas', 'Depilador(a)', 'Massagista',
  'Terapeuta', 'Clínico Geral', 'Dentista', 'Psicólogo(a)', 'Nutricionista',
  'Fisioterapeuta', 'Dermatologista',
];

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

  const uploadPhoto = async (profId: string, file: File) => {
    if (!business) return;
    const ext = file.name.split('.').pop();
    const path = `${business.id}/professionals/${profId}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true });
    if (uploadErr) { toast.error('Erro ao fazer upload.'); return; }
    const { data: urlData } = supabase.storage.from('business-assets').getPublicUrl(path);
    const { error: updateErr } = await supabase.from('professionals').update({ photo_url: urlData.publicUrl }).eq('id', profId);
    if (updateErr) { toast.error('Erro ao salvar foto.'); return; }
    queryClient.invalidateQueries({ queryKey: ['professionals'] });
    toast.success('Foto atualizada!');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]">
              <Plus className="mr-2 h-4 w-4" />Adicionar
            </Button>
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
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!name || addMutation.isPending} className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]">
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
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {professionals.map((prof, i) => (
            <motion.div key={prof.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ProfessionalCard prof={prof} onToggle={() => toggleActive.mutate({ id: prof.id, active: prof.active ?? true })} onUploadPhoto={uploadPhoto} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({ prof, onToggle, onUploadPhoto }: { prof: any; onToggle: () => void; onUploadPhoto: (id: string, file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            {prof.photo_url ? (
              <img src={prof.photo_url} alt={prof.name} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-7 w-7 text-primary" />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="h-4 w-4 text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadPhoto(prof.id, f);
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{prof.name}</p>
            <p className="text-sm text-muted-foreground truncate">{prof.specialty || 'Sem especialidade'}</p>
          </div>
          <Button
            variant={prof.active ? 'default' : 'secondary'}
            size="sm"
            onClick={onToggle}
            className="transition-all duration-200 hover:scale-[1.02] active:scale-[0.97]"
          >
            {prof.active ? 'Ativo' : 'Inativo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
