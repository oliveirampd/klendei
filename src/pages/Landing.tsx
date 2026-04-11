import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { KlendeiLogo } from '@/components/KlendeiLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion';
import { Calendar, ArrowRight, Sparkles, Users } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="container flex items-center justify-between h-16">
          <KlendeiLogo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/auth">Entrar</Link>
            </Button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              <Button asChild>
                <Link to="/auth">Começar grátis</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </nav>

      <section className="container py-20 md:py-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6" style={{ letterSpacing: -0.5 }}>
            Agendamento online para seu negócio
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Salões, clínicas e consultórios usam o Klendei para receber agendamentos 24h por dia, sem complicação.
          </p>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button size="lg" asChild>
              <Link to="/auth">
                Criar minha página grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-t bg-card py-20">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Tudo que você precisa para agendar
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Calendar, title: 'Agenda inteligente', desc: 'Seus clientes agendam online, sem ligações. Você gerencia tudo no painel.' },
              { icon: Users, title: 'Gestão de clientes', desc: 'Histórico completo de visitas, gastos e preferências de cada cliente.' },
              { icon: Sparkles, title: 'Página personalizada', desc: 'Sua marca, suas cores, seu logo. Uma página profissional para compartilhar.' },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feat.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-20 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Comece em menos de 5 minutos</h2>
        <p className="text-muted-foreground mb-8">Crie sua conta, configure seu negócio e compartilhe seu link.</p>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button size="lg" asChild>
            <Link to="/auth">Começar agora — é grátis</Link>
          </Button>
        </motion.div>
      </section>

      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Klendei. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
