import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { BusinessProvider, useBusiness } from "@/hooks/useBusiness";
import { ThemeProvider } from "@/hooks/useTheme";

import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";
import Demo, { DemoAdmin } from "./pages/Demo";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Agenda from "./pages/dashboard/Agenda";
import NewAppointment from "./pages/dashboard/NewAppointment";
import Professionals from "./pages/dashboard/Professionals";
import Services from "./pages/dashboard/Services";
import Clients from "./pages/dashboard/Clients";
import Branding from "./pages/dashboard/Branding";
import SettingsPage from "./pages/dashboard/Settings";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function DashboardRoutes() {
  const { business, loading } = useBusiness();
  const { user } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse text-muted-foreground">Carregando...</div></div>;
  if (!business && user) return <Navigate to="/onboarding" replace />;

  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="novo-agendamento" element={<NewAppointment />} />
        <Route path="profissionais" element={<Professionals />} />
        <Route path="servicos" element={<Services />} />
        <Route path="clientes" element={<Clients />} />
        <Route path="personalizacao" element={<Branding />} />
        <Route path="configuracoes" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <BusinessProvider>
              <DashboardRoutes />
            </BusinessProvider>
          </ProtectedRoute>
        }
      />
      <Route path="/:slug" element={<PublicBooking />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
