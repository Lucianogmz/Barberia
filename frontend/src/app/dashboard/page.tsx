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
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-500 mt-1">
          Resumen de hoy, {formatDateShort(new Date())}
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos de Hoy</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {formatARS(summary?.today.revenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {summary?.today.completedCount ?? 0} turnos completados
            </p>
          </CardContent>
        </Card>

        {/* Weekly Revenue */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos Semanales</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {formatARS(summary?.week.revenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {summary?.week.completedCount ?? 0} turnos esta semana
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos de {monthName}</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {formatARS(summary?.month.revenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
                <CalendarCheck className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              {summary?.month.completedCount ?? 0} turnos este mes
            </p>
          </CardContent>
        </Card>

        {/* Pending Today */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pendientes Hoy</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {summary?.today.pendingCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">Próximos turnos del día</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900">Turnos de Hoy</CardTitle>
          <a href="/dashboard/turnos">
            <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700 hover:bg-violet-50">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </CardHeader>
        <CardContent className="pt-6">
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[70px] py-2 px-3 rounded-lg bg-white border border-slate-200">
                      <p className="text-lg font-bold text-slate-900">
                        {formatTimeES(apt.startTime)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTimeES(apt.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-base">{apt.client.name}</p>
                      <p className="text-sm text-slate-600">{apt.service.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${STATUS_COLORS[apt.status]} border text-xs`}>
                      {STATUS_LABELS[apt.status]}
                    </Badge>
                    {apt.status === 'PENDIENTE' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'COMPLETADO')}
                          className="bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 text-xs h-8 px-3"
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'NO_ASISTIO')}
                          className="bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 text-xs h-8 px-3"
                        >
                          No asistió
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'CANCELADO')}
                          className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs h-8 px-3"
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

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Hoy</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{todayAppointments.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Completados</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {todayAppointments.filter(a => a.status === 'COMPLETADO').length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pendientes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {todayAppointments.filter(a => a.status === 'PENDIENTE').length}
          </p>
        </div>
      </div>
    </div>
  );
}