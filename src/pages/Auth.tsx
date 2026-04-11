import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await signUp(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Conta criada! Verifique seu e-mail para confirmar.');
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error('E-mail ou senha incorretos.');
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Klendei</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? 'Crie sua conta e comece a agendar' : 'Entre na sua conta'}
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setIsSignUp(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  !isSignUp ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => setIsSignUp(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  isSignUp ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Criar conta
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Carregando...' : isSignUp ? 'Criar conta' : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
