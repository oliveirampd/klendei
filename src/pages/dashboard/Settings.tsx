import { useBusiness } from '@/hooks/useBusiness';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { phoneMask } from '@/lib/format';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { business, refetch } = useBusiness();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(business?.name || '');
  const [whatsapp, setWhatsapp] = useState(business?.whatsapp || '');

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!business) throw new Error('No business');
      const { error } = await supabase.from('businesses').update({
        name,
        whatsapp: whatsapp.replace(/\D/g, ''),
      }).eq('id', business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success('Configurações salvas!');
    },
    onError: () => toast.error('Erro ao salvar.'),
  });

  const handleDeleteAccount = async () => {
    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível.')) return;
    if (!business) return;
    await supabase.from('businesses').delete().eq('id', business.id);
    await signOut();
    navigate('/');
  };

  if (!business) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações do negócio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(phoneMask(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input value={business.slug} readOnly className="text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Input value={business.type === 'salon' ? 'Salão de beleza' : 'Clínica / Consultório'} readOnly className="text-muted-foreground" />
          </div>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Plano</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Plano gratuito. Em breve, planos Pro e Business.</p>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-base text-destructive">Zona de perigo</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Excluir conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
