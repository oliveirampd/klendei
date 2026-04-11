import { useBusiness } from '@/hooks/useBusiness';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';

export default function Branding() {
  const { business, refetch } = useBusiness();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState(business?.description || '');
  const [themeColor, setThemeColor] = useState(business?.theme_color || '#7C6EF5');

  const bookingUrl = business ? `${window.location.origin}/${business.slug}` : '';

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      if (!business) throw new Error('No business');
      const { error } = await supabase.from('businesses').update(data).eq('id', business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      toast.success('Atualizado!');
    },
    onError: () => toast.error('Erro ao atualizar.'),
  });

  const handleUpload = async (file: File, field: 'logo_url' | 'banner_url') => {
    if (!business) return;
    const ext = file.name.split('.').pop();
    const path = `${business.id}/${field}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('business-assets')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error('Erro ao fazer upload.');
      return;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('business-assets')
      .getPublicUrl(path);
    updateMutation.mutate({ [field]: publicUrl });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    toast.success('Link copiado!');
  };

  if (!business) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Personalização</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {business.logo_url && (
              <img src={business.logo_url} alt="Logo" className="h-20 w-20 rounded-lg object-cover" />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo_url')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Foto de capa</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {business.banner_url && (
              <img src={business.banner_url} alt="Banner" className="h-32 w-full rounded-lg object-cover" />
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'banner_url')}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Aparência</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição do negócio</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do seu negócio"
            />
          </div>
          <div className="space-y-2">
            <Label>Cor principal</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                className="h-10 w-10 rounded cursor-pointer border-0"
              />
              <Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} className="w-32" />
            </div>
          </div>
          <Button onClick={() => updateMutation.mutate({ description, theme_color: themeColor })}>
            Salvar alterações
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Link de agendamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={bookingUrl} readOnly className="flex-1" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => window.open(`/${business.slug}`, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
