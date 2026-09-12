import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { KlendeiLogo } from '@/components/KlendeiLogo';

type Placa = {
  placa_id: string;
  tipo_destino: 'direto' | 'funil_avaliacao';
  url_destino: string | null;
  url_google: string | null;
  url_feedback_negativo: string | null;
  status: string;
  estabelecimento_nome: string | null;
  estabelecimento_logo: string | null;
};

function detectarSO(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS/i.test(ua)) return 'macOS';
  return 'Outro';
}

const STATUS_ATIVOS = ['ativa', 'instalada', 'vendida'];

export default function PublicScan() {
  const { codigo = '' } = useParams();
  const [estado, setEstado] = useState<'carregando' | 'erro' | 'funil' | 'feedback' | 'enviado'>('carregando');
  const [placa, setPlaca] = useState<Placa | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [nota, setNota] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [contato, setContato] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { data } = await supabase.rpc('resolver_placa', { _codigo: codigo });
      const p = (data as Placa[] | null)?.[0] ?? null;
      if (cancelado) return;
      if (!p || !STATUS_ATIVOS.includes(p.status)) {
        setEstado('erro');
        return;
      }
      setPlaca(p);

      let cidade = '';
      try {
        const r = await fetch('https://ipapi.co/json/');
        if (r.ok) {
          const j = await r.json();
          cidade = [j.city, j.region_code].filter(Boolean).join(' - ');
        }
      } catch { /* geolocalização opcional */ }

      const { data: sid } = await supabase.rpc('registrar_scan', {
        _codigo: codigo,
        _user_agent: navigator.userAgent,
        _so: detectarSO(),
        _cidade: cidade,
      });
      if (cancelado) return;
      setScanId((sid as string) ?? null);

      if (p.tipo_destino === 'direto' && p.url_destino) {
        window.location.replace(p.url_destino);
        return;
      }
      if (p.tipo_destino === 'funil_avaliacao' && !p.url_google && p.url_destino) {
        window.location.replace(p.url_destino);
        return;
      }
      setEstado('funil');
    })();
    return () => { cancelado = true; };
  }, [codigo]);

  const escolherNota = async (valor: number) => {
    setNota(valor);
    const bom = valor >= 4 && !!placa?.url_google;
    if (scanId) {
      await supabase.rpc('registrar_avaliacao', { _scan_id: scanId, _estrelas: valor, _foi_google: bom });
    }
    if (bom) {
      setTimeout(() => window.location.replace(placa!.url_google!), 450);
    } else {
      setTimeout(() => setEstado('feedback'), 300);
    }
  };

  const enviarFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    await supabase.rpc('registrar_feedback', {
      _scan_id: scanId,
      _codigo: codigo,
      _nota: nota ?? 1,
      _comentario: comentario,
      _contato: contato,
    });
    setEnviando(false);
    if (placa?.url_feedback_negativo) {
      window.location.replace(placa.url_feedback_negativo);
      return;
    }
    setEstado('enviado');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <AnimatePresence mode="wait">
          {estado === 'carregando' && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 text-[#888]">
              <Loader2 className="h-8 w-8 animate-spin text-[#7C6EF5]" />
              <p className="text-sm">Carregando...</p>
            </motion.div>
          )}

          {estado === 'erro' && (
            <motion.div key="e" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-[#1A1A1A] flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="h-8 w-8 text-[#7C6EF5]" />
              </div>
              <h1 className="text-white text-xl font-bold" style={{ letterSpacing: -0.5 }}>Placa indisponível</h1>
              <p className="text-[#888] text-sm mt-2">
                Este código não está ativo no momento. Fale com o estabelecimento ou tente novamente mais tarde.
              </p>
              <div className="mt-8 flex justify-center opacity-60"><KlendeiLogo size="sm" /></div>
            </motion.div>
          )}

          {estado === 'funil' && placa && (
            <motion.div key="f" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="text-center">
              {placa.estabelecimento_logo ? (
                <img src={placa.estabelecimento_logo} alt={placa.estabelecimento_nome ?? 'Estabelecimento'}
                  className="h-20 w-20 rounded-2xl object-cover mx-auto mb-6 border border-[#222]" />
              ) : (
                <div className="h-20 w-20 rounded-2xl bg-[#1A1A1A] mx-auto mb-6 flex items-center justify-center text-2xl font-bold text-[#7C6EF5]">
                  {(placa.estabelecimento_nome ?? 'K').charAt(0)}
                </div>
              )}
              <h1 className="text-white text-2xl font-bold leading-snug" style={{ letterSpacing: -0.5 }}>
                Como foi sua experiência {placa.estabelecimento_nome ? `no ${placa.estabelecimento_nome}` : 'conosco'}?
              </h1>
              <p className="text-[#888] text-sm mt-2">Toque nas estrelas para avaliar</p>

              <div className="flex justify-center gap-2 mt-8">
                {[1, 2, 3, 4, 5].map((v) => {
                  const aceso = (hover ?? nota ?? 0) >= v;
                  return (
                    <motion.button key={v} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHover(v)} onMouseLeave={() => setHover(null)}
                      onClick={() => escolherNota(v)} aria-label={`${v} estrelas`}
                      className="p-1">
                      <Star className="h-10 w-10 transition-colors"
                        fill={aceso ? '#7C6EF5' : 'transparent'} stroke={aceso ? '#7C6EF5' : '#444'} strokeWidth={1.5} />
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-12 flex justify-center opacity-40"><KlendeiLogo size="sm" /></div>
            </motion.div>
          )}

          {estado === 'feedback' && (
            <motion.form key="fb" onSubmit={enviarFeedback} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h1 className="text-white text-2xl font-bold" style={{ letterSpacing: -0.5 }}>Conte o que aconteceu</h1>
              <p className="text-[#888] text-sm mt-2">
                Seu comentário vai direto para o estabelecimento e não será publicado.
              </p>
              <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} required maxLength={2000}
                placeholder="O que podemos melhorar?" rows={5}
                className="mt-6 bg-[#141414] border-[#262626] text-white placeholder:text-[#555]" />
              <Input value={contato} onChange={(e) => setContato(e.target.value)} maxLength={200}
                placeholder="Telefone ou e-mail (opcional)"
                className="mt-3 bg-[#141414] border-[#262626] text-white placeholder:text-[#555]" />
              <motion.button type="submit" disabled={enviando} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="w-full mt-5 py-3.5 rounded-xl bg-[#7C6EF5] text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar feedback
              </motion.button>
            </motion.form>
          )}

          {estado === 'enviado' && (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="text-center">
              <CheckCircle2 className="h-16 w-16 text-[#7C6EF5] mx-auto" />
              <h1 className="text-white text-2xl font-bold mt-5" style={{ letterSpacing: -0.5 }}>Obrigado!</h1>
              <p className="text-[#888] text-sm mt-2">Recebemos seu retorno e vamos usar para melhorar.</p>
              <div className="mt-10 flex justify-center opacity-40"><KlendeiLogo size="sm" /></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
