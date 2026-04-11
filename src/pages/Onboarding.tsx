import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify, phoneMask } from '@/lib/format';
import { toast } from 'sonner';
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

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('salon');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map(d => [d.key, { open: '09:00', close: '18:00', closed: d.key === 'sun' }]))
  );

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugify(value));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from('businesses').insert({
      owner_id: user.id,
      name,
      type,
      slug,
      whatsapp: whatsapp.replace(/\D/g, ''),
      hours: hours as unknown as Database['public']['Tables']['businesses']['Insert']['hours'],
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('Este link já está em uso. Escolha outro.');
      } else {
        toast.error('Erro ao criar negócio. Tente novamente.');
      }
      setLoading(false);
      return;
    }

    toast.success('Negócio criado com sucesso!');
    navigate('/dashboard');
  };

  const steps = [
    // Step 0: Name and Type
    <div key="info" className="space-y-6">
      <div className="space-y-2">
        <Label>Nome do negócio</Label>
        <Input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Studio Bella"
        />
      </div>
      <div className="space-y-2">
        <Label>Tipo de negócio</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'salon' as BusinessType, label: 'Salão de beleza', icon: '💇' },
            { value: 'clinic' as BusinessType, label: 'Clínica / Consultório', icon: '🏥' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                type === opt.value
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <p className="mt-2 font-medium text-sm">{opt.label}</p>
            </button>
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
            className="bg-transparent outline-none font-medium flex-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>WhatsApp</Label>
        <Input
          value={whatsapp}
          onChange={(e) => setWhatsapp(phoneMask(e.target.value))}
          placeholder="(11) 99999-9999"
        />
      </div>
    </div>,

    // Step 1: Hours
    <div key="hours" className="space-y-4">
      <p className="text-sm text-muted-foreground">Configure o horário de funcionamento</p>
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
              className="rounded border-border"
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
    </div>,
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Configure seu negócio</h1>
          <p className="text-muted-foreground mt-2">
            {step === 0 ? 'Informações básicas' : 'Horário de funcionamento'}
          </p>
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {steps[step]}
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                  Voltar
                </Button>
              )}
              {step < steps.length - 1 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  className="flex-1"
                  disabled={!name || !slug}
                >
                  Continuar
                </Button>
              ) : (
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar meu negócio'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
