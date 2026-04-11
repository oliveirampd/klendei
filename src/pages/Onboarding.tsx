import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { KlendeiLogo } from '@/components/KlendeiLogo';
import { slugify, phoneMask } from '@/lib/format';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, ChevronLeft, ChevronRight, Upload, Plus } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type BusinessType = Database['public']['Enums']['business_type'];

const DAYS = [
  { key: 'mon', label: 'Segunda' },
  { key: 'tue', label: 'Terça' },
  { key: 'wed', label: 'Quarta' },
  { key: 'thu', label: 'Quinta' },
  { key: 'fri', label: 'Sexta' },
  { key: 'sat', label: 'Sábado' },
  { key: 'sun', label: 'Domingo' },
];

const SPECIALTIES_SALON = ['Cabeleireiro(a)', 'Barbeiro', 'Manicure', 'Pedicure', 'Esteticista', 'Maquiador(a)', 'Designer de sobrancelhas', 'Depilador(a)', 'Massagista'];
const SPECIALTIES_CLINIC = ['Terapeuta', 'Clínico Geral', 'Dentista', 'Psicólogo(a)', 'Nutricionista', 'Fisioterapeuta', 'Dermatologista'];

const SERVICE_TEMPLATES_SALON = [
  { name: 'Corte feminino', price: 80, duration: 45 },
  { name: 'Corte masculino', price: 50, duration: 30 },
  { name: 'Coloração completa', price: 220, duration: 150 },
  { name: 'Escova progressiva', price: 350, duration: 180 },
  { name: 'Hidratação', price: 120, duration: 60 },
  { name: 'Manicure', price: 45, duration: 45 },
  { name: 'Pedicure', price: 55, duration: 50 },
  { name: 'Sobrancelha', price: 35, duration: 30 },
  { name: 'Barba', price: 40, duration: 30 },
  { name: 'Luzes/mechas', price: 280, duration: 180 },
];

const SERVICE_TEMPLATES_CLINIC = [
  { name: 'Consulta inicial', price: 200, duration: 60 },
  { name: 'Retorno', price: 120, duration: 30 },
  { name: 'Avaliação', price: 150, duration: 45 },
  { name: 'Limpeza de pele', price: 180, duration: 60 },
  { name: 'Drenagem linfática', price: 130, duration: 60 },
];

const TOTAL_STEPS = 6;

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Step 0: Basic info
  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('salon');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Step 1: Hours
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map(d => [d.key, { open: '09:00', close: '18:00', closed: d.key === 'sun' }]))
  );

  // Step 2: Branding
  const [description, setDescription] = useState('');
  const [themeColor, setThemeColor] = useState('#7C6EF5');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Step 3: Professional
  const [profName, setProfName] = useState('');
  const [profSpecialty, setProfSpecialty] = useState('');

  // Step 4: Service
  const [svcName, setSvcName] = useState('');
  const [svcPrice, setSvcPrice] = useState('');
  const [svcDuration, setSvcDuration] = useState('30');

  // Created IDs
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const copyAllHours = () => {
    const first = Object.values(hours).find(h => !h.closed);
    if (!first) return;
    setHours(h => Object.fromEntries(DAYS.map(d => [d.key, { ...first, closed: h[d.key].closed }])));
    toast.success('Horários copiados para todos os dias.');
  };

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('business-assets').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('business-assets').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCreateBusiness = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let logoUrl: string | null = null;
      let bannerUrl: string | null = null;

      // Create business first
      const { data: biz, error } = await supabase.from('businesses').insert({
        owner_id: user.id,
        name,
        type,
        slug,
        whatsapp: whatsapp.replace(/\D/g, ''),
        hours: hours as unknown as Database['public']['Tables']['businesses']['Insert']['hours'],
        description: description || null,
        theme_color: themeColor,
      }).select('id').single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este link já está em uso. Escolha outro.');
        } else {
          toast.error('Erro ao criar negócio. Tente novamente.');
        }
        setLoading(false);
        return;
      }

      setBusinessId(biz.id);

      // Upload files if present
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, `${biz.id}/logo`);
        await supabase.from('businesses').update({ logo_url: logoUrl }).eq('id', biz.id);
      }
      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, `${biz.id}/banner`);
        await supabase.from('businesses').update({ banner_url: bannerUrl }).eq('id', biz.id);
      }

      setLoading(false);
      setStep(3); // Move to professional step
    } catch (err) {
      toast.error('Erro ao criar negócio.');
      setLoading(false);
    }
  };

  const handleAddProfessional = async () => {
    if (!businessId || !profName) return;
    setLoading(true);
    const { error } = await supabase.from('professionals').insert({
      business_id: businessId,
      name: profName,
      specialty: profSpecialty || null,
      booking_slug: slugify(profName),
    });
    if (error) toast.error('Erro ao adicionar profissional.');
    else toast.success('Profissional adicionado!');
    setLoading(false);
    setStep(4);
  };

  const handleAddService = async () => {
    if (!businessId || !svcName) return;
    setLoading(true);
    const { error } = await supabase.from('services').insert({
      business_id: businessId,
      name: svcName,
      price: Number(svcPrice) || 0,
      duration_minutes: Number(svcDuration) || 30,
    });
    if (error) toast.error('Erro ao adicionar serviço.');
    else toast.success('Serviço adicionado!');
    setLoading(false);
    setStep(5);
  };

  const handleFinish = async () => {
    if (!businessId) return;
    await supabase.from('businesses').update({ onboarding_completed: true }).eq('id', businessId);
    toast.success('Seu negócio está pronto!');
    navigate('/dashboard');
  };

  const selectTemplate = (t: { name: string; price: number; duration: number }) => {
    setSvcName(t.name);
    setSvcPrice(String(t.price));
    setSvcDuration(String(t.duration));
  };

  const specialties = type === 'salon' ? SPECIALTIES_SALON : SPECIALTIES_CLINIC;
  const templates = type === 'salon' ? SERVICE_TEMPLATES_SALON : SERVICE_TEMPLATES_CLINIC;
  const bookingUrl = `${window.location.origin}/${slug}`;

  const canNext = () => {
    switch (step) {
      case 0: return !!name && !!slug;
      case 1: return true;
      case 2: return true;
      case 3: return !!profName;
      case 4: return !!svcName;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 2) {
      handleCreateBusiness();
    } else if (step === 3) {
      handleAddProfessional();
    } else if (step === 4) {
      handleAddService();
    } else if (step === 5) {
      handleFinish();
    } else {
      setStep(s => s + 1);
    }
  };

  const stepLabels = [
    'Informações básicas',
    'Horário de funcionamento',
    'Personalização',
    'Primeiro profissional',
    'Primeiro serviço',
    'Tudo pronto!',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <KlendeiLogo size="md" className="justify-center mb-6" />
          <h1 className="text-2xl font-bold">Configure seu negócio</h1>
          <p className="text-muted-foreground mt-1">{stepLabels[step]}</p>
          {/* Progress */}
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 w-10 rounded-full transition-colors"
                style={{ backgroundColor: i <= step ? '#7C6EF5' : 'hsl(var(--muted))' }}
              />
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardContent className="pt-6">
                {step === 0 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Nome do negócio</Label>
                      <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Ex: Studio Bella" />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo de negócio</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'salon' as BusinessType, label: 'Salão de beleza', icon: '💇' },
                          { value: 'clinic' as BusinessType, label: 'Clínica / Consultório', icon: '🏥' },
                        ].map((opt) => (
                          <motion.button
                            key={opt.value}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setType(opt.value)}
                            className={`p-4 rounded-lg border-2 text-left transition-colors ${
                              type === opt.value
                                ? 'border-primary bg-accent'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <span className="text-2xl">{opt.icon}</span>
                            <p className="mt-2 font-medium text-sm">{opt.label}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Link de agendamento</Label>
                      <div className="flex items-center rounded-lg border bg-muted px-3 py-2 text-sm">
                        <span className="text-muted-foreground">klendei.com/</span>
                        <input
                          value={slug}
                          onChange={(e) => setSlug(slugify(e.target.value))}
                          className="bg-transparent outline-none font-medium flex-1 text-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>WhatsApp</Label>
                      <Input value={whatsapp} onChange={(e) => setWhatsapp(phoneMask(e.target.value))} placeholder="(11) 99999-9999" />
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Horário de funcionamento</p>
                      <Button variant="outline" size="sm" onClick={copyAllHours}>
                        <Copy className="mr-1 h-3 w-3" />
                        Copiar para todos
                      </Button>
                    </div>
                    {DAYS.map((day) => (
                      <div key={day.key} className="flex items-center gap-3">
                        <div className="w-20">
                          <span className="text-sm font-medium">{day.label}</span>
                        </div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!hours[day.key].closed}
                            onChange={(e) =>
                              setHours((h) => ({ ...h, [day.key]: { ...h[day.key], closed: !e.target.checked } }))
                            }
                            className="rounded border-border accent-[#7C6EF5]"
                          />
                        </label>
                        {!hours[day.key].closed ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={hours[day.key].open}
                              onChange={(e) =>
                                setHours((h) => ({ ...h, [day.key]: { ...h[day.key], open: e.target.value } }))
                              }
                              className="w-28"
                            />
                            <span className="text-muted-foreground">às</span>
                            <Input
                              type="time"
                              value={hours[day.key].close}
                              onChange={(e) =>
                                setHours((h) => ({ ...h, [day.key]: { ...h[day.key], close: e.target.value } }))
                              }
                              className="w-28"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Fechado</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => document.getElementById('logo-input')?.click()}
                      >
                        {logoFile ? (
                          <p className="text-sm text-foreground">{logoFile.name}</p>
                        ) : (
                          <div>
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Clique para enviar seu logo</p>
                          </div>
                        )}
                        <input id="logo-input" type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Foto de capa</Label>
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => document.getElementById('banner-input')?.click()}
                      >
                        {bannerFile ? (
                          <p className="text-sm text-foreground">{bannerFile.name}</p>
                        ) : (
                          <div>
                            <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">Clique para enviar a foto de capa</p>
                          </div>
                        )}
                        <input id="banner-input" type="file" accept="image/*" className="hidden" onChange={e => setBannerFile(e.target.files?.[0] || null)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor do tema</Label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeColor}
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="h-10 w-10 rounded-lg border cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">Cor usada nos botões da sua página pública</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição do negócio</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Conte um pouco sobre seu negócio..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Nome do profissional</Label>
                      <Input value={profName} onChange={(e) => setProfName(e.target.value)} placeholder="Ex: Ana Silva" />
                    </div>
                    <div className="space-y-2">
                      <Label>Especialidade</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {specialties.map(s => (
                          <motion.button
                            key={s}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setProfSpecialty(s)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                              profSpecialty === s
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {s}
                          </motion.button>
                        ))}
                      </div>
                      <Input
                        value={profSpecialty}
                        onChange={(e) => setProfSpecialty(e.target.value)}
                        placeholder="Ou digite uma especialidade..."
                      />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Templates rápidos</Label>
                      <div className="flex flex-wrap gap-2">
                        {templates.map(t => (
                          <motion.button
                            key={t.name}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => selectTemplate(t)}
                            className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                              svcName === t.name
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {t.name}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Nome do serviço</Label>
                      <Input value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Ex: Corte feminino" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Preço (R$)</Label>
                        <Input type="number" value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} placeholder="80" />
                      </div>
                      <div className="space-y-2">
                        <Label>Duração (min)</Label>
                        <Input type="number" value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} placeholder="45" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="text-center py-4 space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="h-16 w-16 rounded-full bg-primary mx-auto flex items-center justify-center"
                    >
                      <Check className="h-8 w-8 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-xl font-bold">Seu negócio está pronto!</h2>
                      <p className="text-muted-foreground mt-1">Compartilhe seu link de agendamento</p>
                    </div>
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                      <span className="text-sm flex-1 truncate">{bookingUrl}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(bookingUrl);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 mt-8">
                  {step > 0 && step < 5 && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="flex-1">
                      <Button variant="outline" onClick={() => setStep(step - 1)} className="w-full">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Voltar
                      </Button>
                    </motion.div>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="flex-1">
                    <Button
                      onClick={handleNext}
                      className="w-full"
                      disabled={!canNext() || loading}
                    >
                      {loading ? 'Salvando...' : step === 5 ? 'Ir para o painel' : step === 2 ? 'Criar negócio' : 'Continuar'}
                      {!loading && step < 5 && <ChevronRight className="ml-1 h-4 w-4" />}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
