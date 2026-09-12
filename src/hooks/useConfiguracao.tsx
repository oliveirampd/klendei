import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Configuracao = {
  id: string;
  dominio_curto: string;
  cor_qr: string;
  cor_fundo_qr: string;
  email_notificacao: string | null;
  whatsapp_notificacao: string | null;
};

export function useConfiguracao() {
  return useQuery({
    queryKey: ['configuracao'],
    queryFn: async (): Promise<Configuracao | null> => {
      const { data, error } = await supabase.from('configuracoes').select('*').limit(1).maybeSingle();
      if (error) throw error;
      if (data) return data as Configuracao;
      const { data: novo } = await supabase.from('configuracoes').insert({}).select('*').maybeSingle();
      return (novo as Configuracao) ?? null;
    },
  });
}

export function linkPlaca(codigo: string, dominio?: string | null) {
  const base = (dominio || 'klendei.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${base}/p/${codigo}`;
}
