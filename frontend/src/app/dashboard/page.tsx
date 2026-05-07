'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  CalendarCheck,
  Clock,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { useApiToken } from '@/components/providers/token-provider';
import {
  getDashboardSummary,
  getAppointments,
  updateAppointmentStatus,
  type RevenueSummary,
  type AppointmentResponse,
} from '@/lib/api-client';
import {
  formatARS,
  formatTimeES,
  formatDateShort,
  getMonthNameES,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/formatters';
import { toast } from 'sonner';

export default function DashboardPage() {
  const token = useApiToken();
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const monthName = getMonthNameES(now.getMonth() + 1);

  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        const [summaryData, appointments] = await Promise.all([
          getDashboardSummary(token),
          getAppointments(token, new Date().toISOString().split('T')[0]),
        ]);
        setSummary(summaryData);
        setTodayAppointments(appointments);
      } catch (error) {
        toast.error('Error al cargar el panel');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!token) return;
    try {
      await updateAppointmentStatus(token, id, status);
      // Reload data
      const [summaryData, appointments] = await Promise.all([
        getDashboardSummary(token),
        getAppointments(token, new Date().toISOString().split('T')[0]),
      ]);
      setSummary(summaryData);
      setTodayAppointments(appointments);
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  if (loading || !token) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Panel de control</h1>
        <p className="text-white/50 mt-1">
          Resumen de hoy, {formatDateShort(new Date())}
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Ingresos de hoy</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatARS(summary?.today.revenue ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-white/30 mt-3">
              {summary?.today.completedCount ?? 0} turnos completados
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Ingresos semanales</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatARS(summary?.week.revenue ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-white/30 mt-3">
              {summary?.week.completedCount ?? 0} turnos esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Ingresos de {monthName}</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatARS(summary?.month.revenue ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <CalendarCheck className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <p className="text-xs text-white/30 mt-3">
              {summary?.month.completedCount ?? 0} turnos este mes
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-amber-500/10 to-amber-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Turnos pendientes hoy</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {summary?.today.pendingCount ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <p className="text-xs text-white/30 mt-3">Próximos turnos del día</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white text-lg">Turnos de hoy</CardTitle>
          <a href="/dashboard/turnos">
            <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </CardHeader>
        <CardContent>
          {todayAppointments.length === 0 ? (
            <p className="text-white/30 text-center py-8">
              No hay turnos programados para hoy
            </p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
                      <p className="text-lg font-bold text-white">
                        {formatTimeES(apt.startTime)}
                      </p>
                      <p className="text-xs text-white/30">
                        {formatTimeES(apt.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-white">{apt.client.name}</p>
                      <p className="text-sm text-white/40">{apt.service.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${STATUS_COLORS[apt.status]} border text-xs`}>
                      {STATUS_LABELS[apt.status]}
                    </Badge>
                    {apt.status === 'PENDIENTE' && (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'COMPLETADO')}
                          className="bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs h-7 px-2"
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'NO_ASISTIO')}
                          className="bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 text-xs h-7 px-2"
                        >
                          No asistió
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'CANCELADO')}
                          className="bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs h-7 px-2"
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
