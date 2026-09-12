import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ScanLine, Star, AlertTriangle, TrendingUp, Plus } from 'lucide-react';
import { formatDate, formatRelative } from '@/lib/format';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { subDays, startOfDay, format } from 'date-fns';

export default function VisaoGeral() {
  const { data, isLoading } = useQuery({
    queryKey: ['visao-geral'],
    queryFn: async () => {
      const trintaDias = subDays(new Date(), 30).toISOString();
      const [placasRes, scansRes] = await Promise.all([
        supabase.from('placas').select('id, codigo_curto, status, apelido, estabelecimento_id, preco_venda, estabelecimentos(nome)'),
        supabase.from('scans').select('id, placa_id, timestamp, avaliacao_estrelas, redirecionou_para_google').gte('timestamp', trintaDias).order('timestamp', { ascending: false }),
      ]);
      if (placasRes.error) throw placasRes.error;
      if (scansRes.error) throw scansRes.error;

      const { data: ultimos } = await supabase
        .from('scans').select('placa_id, timestamp').order('timestamp', { ascending: false }).limit(2000);

      return { placas: placasRes.data ?? [], scans: scansRes.data ?? [], todosScans: ultimos ?? [] };
    },
  });

  const placas = data?.placas ?? [];
  const scans = data?.scans ?? [];
  const hoje = startOfDay(new Date());
  const semana = subDays(hoje, 7);
  const scansHoje = scans.filter((s) => new Date(s.timestamp) >= hoje).length;
  const scansSemana = scans.filter((s) => new Date(s.timestamp) >= semana).length;
  const scansMes = scans.length;
  const comNota = scans.filter((s) => s.avaliacao_estrelas != null).length;
  const foramGoogle = scans.filter((s) => s.redirecionou_para_google).length;
  const conversao = comNota ? Math.round((foramGoogle / comNota) * 100) : 0;
  const ativas = placas.filter((p) => ['ativa', 'instalada'].includes(p.status)).length;
  const vendidas = placas.filter((p) => p.status !== 'em_estoque' && p.status !== 'defeito').length;

  const ultimoPorPlaca = new Map<string, string>();
  (data?.todosScans ?? []).forEach((s) => {
    if (!ultimoPorPlaca.has(s.placa_id)) ultimoPorPlaca.set(s.placa_id, s.timestamp);
  });
  const limite = subDays(new Date(), 30);
  const inativas = placas
    .filter((p) => ['ativa', 'instalada'].includes(p.status))
    .map((p) => ({ ...p, ultimo: ultimoPorPlaca.get(p.id) }))
    .filter((p) => !p.ultimo || new Date(p.ultimo) < limite);

  const serie = Array.from({ length: 30 }, (_, i) => {
    const dia = subDays(hoje, 29 - i);
    const total = scans.filter((s) => startOfDay(new Date(s.timestamp)).getTime() === dia.getTime()).length;
    return { dia: format(dia, 'dd/MM'), scans: total };
  });

  const kpis = [
    { label: 'Placas vendidas', valor: vendidas, icon: QrCode },
    { label: 'Placas ativas', valor: ativas, icon: TrendingUp },
    { label: 'Scans hoje', valor: scansHoje, icon: ScanLine },
    { label: 'Scans (7 dias)', valor: scansSemana, icon: ScanLine },
    { label: 'Scans (30 dias)', valor: scansMes, icon: ScanLine },
    { label: 'Conversão p/ Google', valor: `${conversao}%`, icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ letterSpacing: -0.5 }}>Visão geral</h1>
          <p className="text-muted-foreground text-sm">{formatDate(new Date())}</p>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button asChild><Link to="/dashboard/placas"><Plus className="mr-2 h-4 w-4" />Nova placa</Link></Button>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="h-full">
              <CardContent className="p-4">
                <k.icon className="h-4 w-4 text-primary" />
                <p className="text-2xl font-bold mt-2">{isLoading ? '—' : k.valor}</p>
                <p className="text-xs text-muted-foreground leading-tight">{k.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Scans nos últimos 30 dias</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie}>
              <defs>
                <linearGradient id="gscan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C6EF5" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#7C6EF5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="dia" tick={{ fontSize: 11 }} interval={4} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12 }} />
              <Area type="monotone" dataKey="scans" stroke="#7C6EF5" strokeWidth={2} fill="url(#gscan)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className={inativas.length ? 'border-warning/40' : ''}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Placas sem atividade há mais de 30 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inativas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum alerta. Todas as placas ativas receberam scans recentes.</p>
          ) : (
            <div className="space-y-2">
              {inativas.map((p) => (
                <Link key={p.id} to={`/dashboard/placas/${p.id}`}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {p.apelido || p.codigo_curto}
                      <span className="text-muted-foreground font-normal"> · {(p as any).estabelecimentos?.nome ?? 'Sem estabelecimento'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.ultimo ? `Último scan ${formatRelative(p.ultimo)}` : 'Nunca recebeu scans'}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-yellow-500 text-yellow-600 shrink-0">Verificar</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
