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

const ACTION_BUTTONS = {
  COMPLETADO: 'bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/50 hover:border-emerald-300',
  NO_ASISTIO: 'bg-amber-50/80 text-amber-600 hover:bg-amber-100 border border-amber-200/50 hover:border-amber-300',
  CANCELADO: 'bg-red-50/80 text-red-600 hover:bg-red-100 border border-red-200/50 hover:border-red-300',
};

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
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Panel de Control</h1>
        <p className="text-slate-500 mt-1.5 text-base">
          Resumen de hoy, {formatDateShort(new Date())}
        </p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos de Hoy</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {formatARS(summary?.today.revenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center border border-emerald-100/60">
                <DollarSign className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {summary?.today.completedCount ?? 0} turnos completados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos Semanales</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {formatARS(summary?.week.revenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center border border-blue-100/60">
                <TrendingUp className="w-7 h-7 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {summary?.week.completedCount ?? 0} turnos esta semana
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos de {monthName}</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {formatARS(summary?.month.revenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 flex items-center justify-center border border-violet-100/60">
                <CalendarCheck className="w-7 h-7 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              {summary?.month.completedCount ?? 0} turnos este mes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pendientes Hoy</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {summary?.today.pendingCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center border border-amber-100/60">
                <Clock className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">Próximos turnos del día</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <CardHeader className="flex flex-row items-center justify-between pb-5 border-b border-slate-100/80">
          <CardTitle className="text-lg font-medium text-slate-900">Turnos de Hoy</CardTitle>
          <a href="/dashboard/turnos">
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl">
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </a>
        </CardHeader>
        <CardContent className="pt-6">
          {todayAppointments.length === 0 ? (
            <div className="text-center py-14">
              <CalendarCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <div className="space-y-4">
              {todayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/80 border border-slate-100/80 hover:border-slate-200/80 hover:bg-slate-100/50 hover:shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="text-center min-w-[75px] py-3 px-4 rounded-xl bg-white border border-slate-200/50 shadow-sm">
                      <p className="text-lg font-semibold text-slate-900 tracking-tight">
                        {formatTimeES(apt.startTime)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatTimeES(apt.endTime)}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-base">{apt.client.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">{apt.service.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${STATUS_COLORS[apt.status]} border text-xs font-medium`}>
                      {STATUS_LABELS[apt.status]}
                    </Badge>
                    {apt.status === 'PENDIENTE' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'COMPLETADO')}
                          className="bg-emerald-50/80 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/50 text-xs h-8 px-3.5 rounded-xl"
                        >
                          Completar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'NO_ASISTIO')}
                          className="bg-amber-50/80 text-amber-600 hover:bg-amber-100 border border-amber-200/50 text-xs h-8 px-3.5 rounded-xl"
                        >
                          No asistió
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, 'CANCELADO')}
                          className="bg-red-50/80 text-red-600 hover:bg-red-100 border border-red-200/50 text-xs h-8 px-3.5 rounded-xl"
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
      <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Hoy</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">{todayAppointments.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Completados</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">
            {todayAppointments.filter(a => a.status === 'COMPLETADO').length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Pendientes</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">
            {todayAppointments.filter(a => a.status === 'PENDIENTE').length}
          </p>
        </div>
      </div>
    </div>
  );
}
