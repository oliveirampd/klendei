import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useBusiness } from '@/hooks/useBusiness';
import { KlendeiLogo } from '@/components/KlendeiLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Home, Calendar, Users, Scissors, UserCircle, Palette, Settings, LogOut, ExternalLink, Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const NAV_ITEMS = [
  { title: 'Início', url: '/dashboard', icon: Home },
  { title: 'Agenda', url: '/dashboard/agenda', icon: Calendar },
  { title: 'Novo Agendamento', url: '/dashboard/agenda?new=1', icon: Plus },
  { title: 'Profissionais', url: '/dashboard/profissionais', icon: Users },
  { title: 'Serviços', url: '/dashboard/servicos', icon: Scissors },
  { title: 'Clientes', url: '/dashboard/clientes', icon: UserCircle },
  { title: 'Personalização', url: '/dashboard/personalizacao', icon: Palette },
  { title: 'Configurações', url: '/dashboard/configuracoes', icon: Settings },
];

function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const { business } = useBusiness();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col justify-between h-full">
        <div>
          <div className="p-4 border-b border-sidebar-border">
            {!collapsed ? (
              <KlendeiLogo size="sm" />
            ) : (
              <div className="h-7 w-7 rounded-xl bg-[#7C6EF5] flex items-center justify-center">
                <span className="text-white font-medium text-sm" style={{ letterSpacing: -1 }}>k</span>
              </div>
            )}
            {!collapsed && business && (
              <p className="text-xs text-muted-foreground truncate mt-1">{business.name}</p>
            )}
          </div>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === '/dashboard'}
                          className="hover:bg-sidebar-accent"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </motion.div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        <div className="p-4 border-t border-sidebar-border space-y-2">
          {business && !collapsed && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => window.open(`/${business.slug}`, '_blank')}
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              Ver página pública
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-3 w-3" />
            {!collapsed && 'Sair'}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b px-4 bg-card">
            <SidebarTrigger className="mr-4" />
            <ThemeToggle />
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
