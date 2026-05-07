import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'Barbería — Reservá tu turno',
  description:
    'Sistema de turnos online para barbería. Reservá tu corte de manera rápida y sencilla.',
  keywords: ['barbería', 'turnos', 'corte', 'reserva', 'argentina'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-helvetica antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
