'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import {
  Scissors,
  LayoutDashboard,
  CalendarDays,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { registerTokens } from '@/lib/api-client';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiToken, setApiToken] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/dashboard/login');
    }
  }, [status, router]);

  // Register tokens with backend on first load
  useEffect(() => {
    const syncTokens = async () => {
      if (
        session?.googleAccessToken &&
        session?.googleRefreshToken &&
        session?.user?.email
      ) {
        try {
          const stored = localStorage.getItem('barberia_api_token');
          if (stored) {
            setApiToken(stored);
            return;
          }

          const result = await registerTokens({
            email: session.user.email,
            name: session.user.name ?? 'Barbero',
            image: session.user.image ?? undefined,
            googleAccessToken: session.googleAccessToken,
            googleRefreshToken: session.googleRefreshToken,
            googleTokenExpiry:
              session.googleTokenExpiry ?? new Date().toISOString(),
          });

          localStorage.setItem('barberia_api_token', result.accessToken);
          setApiToken(result.accessToken);
        } catch (error) {
          console.error('Failed to sync tokens with backend:', error);
        }
      }
    };

    syncTokens();
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a1a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  const navItems = [
    { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
    { href: '/dashboard/turnos', label: 'Turnos', icon: CalendarDays },
    { href: '/dashboard/servicios', label: 'Servicios', icon: Scissors },
    { href: '/dashboard/ingresos', label: 'Ingresos', icon: DollarSign },
    { href: '/dashboard/configuracion', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('barberia_api_token');
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a1a] flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-[#0d0d20]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Barbería</h1>
            <p className="text-xs text-white/40">Panel de control</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2 mb-4">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-white/40 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-white/50 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-white/5 bg-[#0d0d20] transform transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Barbería</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-white/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-purple-500/15 text-purple-400'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-white/50 hover:text-red-400"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-white/5">
          <button onClick={() => setSidebarOpen(true)} className="text-white/70">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-white">Barbería</h1>
          <div className="w-6" />
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          {/* Pass apiToken through context */}
          <TokenContext.Provider value={apiToken}>
            {children}
          </TokenContext.Provider>
        </main>
      </div>
    </div>
  );
}

// Context for sharing the API token with child pages

import { TokenContext } from '@/components/providers/token-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
