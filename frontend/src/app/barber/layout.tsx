'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SessionProvider } from 'next-auth/react';
import { TokenContext } from '@/components/providers/token-provider';
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

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== '/barber/login') {
      router.push('/barber/login');
    }
  }, [status, router, pathname]);

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-300 border-t-slate-800" />
      </div>
    );
  }

  if (status === 'unauthenticated' && pathname !== '/barber/login') return null;

  const navItems = [
    { href: '/barber', label: 'Panel', icon: LayoutDashboard },
    { href: '/barber/turnos', label: 'Turnos', icon: CalendarDays },
    { href: '/barber/servicios', label: 'Servicios', icon: Scissors },
    { href: '/barber/ingresos', label: 'Ingresos', icon: DollarSign },
    { href: '/barber/configuracion', label: 'Configuración', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('barberia_api_token');
    signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-slate-900 to-black flex items-center justify-center shadow-lg shadow-slate-900/20">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Barbería</h1>
            <p className="text-sm text-slate-500">Panel de control</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100/80">
          <div className="flex items-center gap-3 px-2 mb-3">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-10 h-10 rounded-full ring-2 ring-slate-200/60"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {session?.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-white border-r border-slate-200/60 shadow-[8px_0_30px_-4px_rgba(0,0,0,0.08)] transform transition-transform duration-300 ease-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-900 to-black flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Barbería</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
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
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300
                  ${isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100/80">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50/80 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-white border-b border-slate-100 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-700">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900">Barbería</h1>
          <div className="w-6" />
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto bg-slate-50">
          <TokenContext.Provider value={apiToken}>
            {children}
          </TokenContext.Provider>
        </main>
      </div>
    </div>
  );
}

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
