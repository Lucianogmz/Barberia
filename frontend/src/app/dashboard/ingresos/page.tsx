'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserX,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { useApiToken } from '@/components/providers/token-provider';
import {
  getMonthlyRevenue,
  getServiceBreakdown,
  type MonthlyRevenue,
  type ServiceBreakdown,
} from '@/lib/api-client';
import { formatARS, getMonthNameES } from '@/lib/formatters';
import { toast } from 'sonner';

export default function IngresosPage() {
  const token = useApiToken();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [revenue, setRevenue] = useState<MonthlyRevenue | null>(null);
  const [breakdown, setBreakdown] = useState<ServiceBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      getMonthlyRevenue(token, year, month),
      getServiceBreakdown(token, year, month),
    ])
      .then(([rev, brk]) => {
        setRevenue(rev);
        setBreakdown(brk);
      })
      .catch(() => toast.error('Error al cargar los ingresos'))
      .finally(() => setLoading(false));
  }, [token, year, month]);

  const prevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const totalAppointments =
    (revenue?.completedCount ?? 0) +
    (revenue?.cancelledCount ?? 0) +
    (revenue?.noShowCount ?? 0) +
    (revenue?.pendingCount ?? 0);

  const completionRate =
    totalAppointments > 0
      ? Math.round(((revenue?.completedCount ?? 0) / totalAppointments) * 100)
      : 0;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Métricas de Ingresos</h1>
          <p className="text-slate-500 mt-1">
            Seguimiento financiero y análisis de servicios
          </p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-white rounded-lg border border-slate-200 px-4 py-2 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-base font-semibold text-slate-900">
              {getMonthNameES(month)} {year}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 p-1"
            disabled={year >= now.getFullYear() && month >= now.getMonth() + 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {formatARS(revenue?.totalRevenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Ingresos del mes actual
            </p>
          </CardContent>
        </Card>

        {/* Completed Appointments */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Turnos Completados</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {revenue?.completedCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-violet-50 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Tasa de completado: <span className="font-semibold text-green-600">{completionRate}%</span>
            </p>
          </CardContent>
        </Card>

        {/* Cancelled */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Cancelados</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {revenue?.cancelledCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Turnos cancelados
            </p>
          </CardContent>
        </Card>

        {/* No Shows */}
        <Card className="border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">No Asistieron</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {revenue?.noShowCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center">
                <UserX className="w-7 h-7 text-orange-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Clientes sin asistencia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-violet-600" />
            Desglose por Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {breakdown.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No hay datos para este período</p>
            </div>
          ) : (
            <div className="space-y-6">
              {breakdown.map((item, index) => {
                const maxCount = Math.max(...breakdown.map((b) => b.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={item.serviceId} className="space-y-3">
                    {/* Service Name & Stats */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400 w-5">
                          #{index + 1}
                        </span>
                        <span className="font-semibold text-slate-900 text-base">
                          {item.serviceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">
                          {item.count} turno{item.count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-base font-bold text-green-600 min-w-[100px] text-right">
                          {formatARS(item.revenue)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total Turnos</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalAppointments}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pendientes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{revenue?.pendingCount ?? 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Promedio/Turno</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalAppointments > 0 
              ? formatARS(Math.round((revenue?.totalRevenue ?? 0) / totalAppointments))
              : formatARS(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Ingresos Día</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {totalAppointments > 0 
              ? formatARS(Math.round((revenue?.totalRevenue ?? 0) / 30))
              : formatARS(0)}
          </p>
        </div>
      </div>
    </div>
  );
}