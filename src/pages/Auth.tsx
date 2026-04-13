import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KlendeiLogo } from '@/components/KlendeiLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Building2 } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const STATS = [
  { value: '1.200+', label: 'Empresas ativas' },
  { value: '48 mil+', label: 'Agendamentos/mês' },
  { value: '4.9★', label: 'Avaliação média' },
  { value: '99.9%', label: 'Tempo de atividade' },
];

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) { toast.error(error.message); }
      else { toast.success('Conta criada! Verifique seu e-mail para confirmar.'); }
    } else {
      const { error } = await signIn(email, password);
      if (error) { toast.error('E-mail ou senha incorretos.'); }
      else { navigate('/dashboard'); }
    }
    setLoading(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Hero */}
      <div className="relative lg:w-[60%] bg-[#0D0D0D] p-8 lg:p-16 flex flex-col justify-between overflow-hidden min-h-[40vh] lg:min-h-screen">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full top-[-100px] left-[-100px] opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #7C6EF5 0%, transparent 70%)', animation: 'float1 20s ease-in-out infinite' }} />
          <div className="absolute w-[400px] h-[400px] rounded-full bottom-[-50px] right-[-50px] opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #7C6EF5 0%, transparent 70%)', animation: 'float2 25s ease-in-out infinite' }} />
        </div>
        <div className="relative z-10"><KlendeiLogo size="md" /></div>
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-3xl lg:text-5xl font-bold text-white leading-tight" style={{ letterSpacing: -0.5 }}>
            Gerencie seus agendamentos de forma inteligente
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="text-[#A0A0A0] mt-4 text-lg max-w-lg">
            Plataforma completa para salões e clínicas. Seus clientes agendam online, você foca no que importa.
          </motion.p>
          <div className="grid grid-cols-2 gap-3 mt-10">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="rounded-xl p-4 border" style={{ background: 'rgba(124,110,245,0.12)', borderColor: 'rgba(124,110,245,0.25)' }}>
                <p className="text-white text-xl lg:text-2xl font-bold">{stat.value}</p>
                <p className="text-[#888] text-sm mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className={`lg:w-[40%] flex items-center justify-center p-8 relative ${isDark ? 'bg-[#111111]' : 'bg-card'}`}>
        <ThemeToggle className="absolute top-4 right-4" />
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-full max-w-sm">
          <div className={`flex rounded-full p-1 mb-8 ${isDark ? 'bg-[#1A1A1A]' : 'bg-muted'}`}>
            {[{ label: 'Entrar', value: false }, { label: 'Criar conta', value: true }].map((tab) => (
              <button key={tab.label} onClick={() => setIsSignUp(tab.value)}
                className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                  isSignUp === tab.value ? 'bg-primary text-primary-foreground' : `${isDark ? 'text-[#888] hover:text-white' : 'text-muted-foreground hover:text-foreground'}`
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={isSignUp ? 'signup' : 'signin'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <h2 className="text-2xl font-bold text-foreground mb-1" style={{ letterSpacing: -0.5 }}>
                {isSignUp ? 'Comece gratuitamente' : 'Bem-vindo de volta'}
              </h2>
              <p className="text-primary text-sm mb-6">
                {isSignUp ? 'Crie sua conta e configure seu negócio' : 'Entre com seu email e senha para acessar sua conta'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-sm">Nome do negócio</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Studio Bella" className="pl-10" />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-sm">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="pl-10" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-sm">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required minLength={6} className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 hover:opacity-90">
                  {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </form>

              {!isSignUp && <button className="text-primary text-sm mt-4 hover:underline">Esqueceu sua senha?</button>}
              {isSignUp && (
                <p className="text-muted-foreground text-xs mt-4 text-center">
                  Ao continuar, você concorda com nossos <span className="text-primary hover:underline cursor-pointer">Termos de Uso</span> e <span className="text-primary hover:underline cursor-pointer">Política de Privacidade</span>
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(30px, 20px); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-20px, -30px); } }
      `}</style>
    </div>
  );
}
