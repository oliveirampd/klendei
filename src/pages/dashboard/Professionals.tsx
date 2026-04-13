import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, UserCircle, Camera, Pencil, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const SPECIALTIES = [
  'Cabeleireiro(a)', 'Barbeiro', 'Manicure', 'Pedicure', 'Esteticista',
  'Maquiador(a)', 'Designer de sobrancelhas', 'Depilador(a)', 'Massagista',
  'Terapeuta', 'Clínico Geral', 'Dentista', 'Psicólogo(a)', 'Nutricionista',
  'Fisioterapeuta', 'Dermatologista',
];

const DAYS = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

const DEFAULT_SCHEDULE = DAYS.reduce((acc, d) => {
  acc[d.key] = { enabled: d.key !== 'dom', start: '08:00', end: '18:00' };
  return acc;
}, {} as Record<string, { enabled: boolean; start: string; end: string }>);

export default function Professionals() {
  const { business } = useBusiness();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<any>(null);
  const [editSchedule, setEditSchedule] = useState<any>(null);
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals', business?.id],
    queryFn: async () => {
      if (!business) return [];
      const { data, error } = await supabase.from('professionals').select('*').eq('business_id', business.id).order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!business,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error('No business');
      const finalSpecialty = specialty === '__custom__' ? customSpecialty : specialty;
      const bookingSlug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
      const { error } = await supabase.from('professionals').insert({
        business_id: business.id, name, specialty: finalSpecialty, booking_slug: bookingSlug,
        schedule: DEFAULT_SCHEDULE,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setOpen(false); setName(''); setSpecialty(''); setCustomSpecialty('');
      toast.success('Profissional adicionado!');
    },
    onError: () => toast.error('Erro ao adicionar profissional.'),
  });

  const updateMutation = useMutation({
    mutationFn: async (prof: { id: string; name: string; specialty: string }) => {
      const { id, ...rest } = prof;
      const { error } = await supabase.from('professionals').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setEditOpen(false);
      toast.success('Profissional atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar.'),
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, schedule }: { id: string; schedule: any }) => {
      const { error } = await supabase.from('professionals').update({ schedule }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setScheduleOpen(false);
      toast.success('Horários atualizados!');
    },
    onError: () => toast.error('Erro ao atualizar horários.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('professionals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profissional removido!');
    },
    onError: () => toast.error('Erro ao remover.'),
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

  const openEditProf = (prof: any) => {
    setEditingProf({ ...prof });
    setEditOpen(true);
  };

  const openSchedule = (prof: any) => {
    setEditSchedule({ id: prof.id, name: prof.name, schedule: prof.schedule || DEFAULT_SCHEDULE });
    setScheduleOpen(true);
  };

  const handleDeleteProf = (id: string, pname: string) => {
    if (confirm(`Deseja remover "${pname}"?`)) deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profissionais</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
            </motion.div>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo profissional</DialogTitle></DialogHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((s) => (
                    <motion.button key={s} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setSpecialty(s); setCustomSpecialty(''); }}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${specialty === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}>
                      {s}
                    </motion.button>
                  ))}
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setSpecialty('__custom__')}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${specialty === '__custom__' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}>
                    Outro...
                  </motion.button>
                </div>
                {specialty === '__custom__' && (
                  <Input value={customSpecialty} onChange={(e) => setCustomSpecialty(e.target.value)} placeholder="Digite a especialidade" className="mt-2" />
                )}
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={() => addMutation.mutate()}
                  disabled={!name || (!specialty || (specialty === '__custom__' && !customSpecialty)) || addMutation.isPending}
                  className="w-full">
                  {addMutation.isPending ? 'Salvando...' : 'Adicionar'}
                </Button>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar profissional</DialogTitle></DialogHeader>
          {editingProf && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={editingProf.name} onChange={(e) => setEditingProf({ ...editingProf, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Especialidade</Label>
                <Input value={editingProf.specialty || ''} onChange={(e) => setEditingProf({ ...editingProf, specialty: e.target.value })} />
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={() => updateMutation.mutate(editingProf)} disabled={updateMutation.isPending} className="w-full">
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Horários — {editSchedule?.name}</DialogTitle></DialogHeader>
          {editSchedule && (
            <div className="space-y-4">
              {DAYS.map((day) => {
                const daySchedule = editSchedule.schedule[day.key] || { enabled: false, start: '08:00', end: '18:00' };
                return (
                  <div key={day.key} className="flex items-center gap-3">
                    <Switch checked={daySchedule.enabled} onCheckedChange={(checked) => {
                      setEditSchedule({
                        ...editSchedule,
                        schedule: { ...editSchedule.schedule, [day.key]: { ...daySchedule, enabled: checked } },
                      });
                    }} />
                    <span className="text-sm w-20">{day.label}</span>
                    {daySchedule.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <Input type="time" value={daySchedule.start} className="w-28"
                          onChange={(e) => setEditSchedule({
                            ...editSchedule,
                            schedule: { ...editSchedule.schedule, [day.key]: { ...daySchedule, start: e.target.value } },
                          })} />
                        <span className="text-muted-foreground text-sm">até</span>
                        <Input type="time" value={daySchedule.end} className="w-28"
                          onChange={(e) => setEditSchedule({
                            ...editSchedule,
                            schedule: { ...editSchedule.schedule, [day.key]: { ...daySchedule, end: e.target.value } },
                          })} />
                      </div>
                    )}
                  </div>
                );
              })}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button onClick={() => updateScheduleMutation.mutate({ id: editSchedule.id, schedule: editSchedule.schedule })}
                  disabled={updateScheduleMutation.isPending} className="w-full">
                  {updateScheduleMutation.isPending ? 'Salvando...' : 'Salvar horários'}
                </Button>
              </motion.div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
              <ProfessionalCard prof={prof}
                onToggle={() => toggleActive.mutate({ id: prof.id, active: prof.active ?? true })}
                onUploadPhoto={uploadPhoto}
                onEdit={() => openEditProf(prof)}
                onDelete={() => handleDeleteProf(prof.id, prof.name)}
                onSchedule={() => openSchedule(prof)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({ prof, onToggle, onUploadPhoto, onEdit, onDelete, onSchedule }: {
  prof: any; onToggle: () => void; onUploadPhoto: (id: string, file: File) => void;
  onEdit: () => void; onDelete: () => void; onSchedule: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {prof.photo_url ? (
              <img src={prof.photo_url} alt={prof.name} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="h-7 w-7 text-primary" />
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-4 w-4 text-white" />
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUploadPhoto(prof.id, f);
            }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{prof.name}</p>
            <p className="text-sm text-muted-foreground truncate">{prof.specialty || 'Sem especialidade'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant={prof.active ? 'default' : 'secondary'} size="sm" onClick={onToggle}>
              {prof.active ? 'Ativo' : 'Inativo'}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" onClick={onSchedule}><Clock className="h-3 w-3" /></Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" onClick={onEdit}><Pencil className="h-3 w-3" /></Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
