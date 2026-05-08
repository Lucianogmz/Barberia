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
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Métricas de Ingresos</h1>
          <p className="text-slate-500 mt-1.5 text-base">
            Seguimiento financiero y análisis de servicios
          </p>
        </div>
        
        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200/60 px-4 py-2 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)]">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevMonth}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-base font-medium text-slate-900">
              {getMonthNameES(month)} {year}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-2 transition-all"
            disabled={year >= now.getFullYear() && month >= now.getMonth() + 1}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Ingresos Totales</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {formatARS(revenue?.totalRevenue ?? 0)}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center border border-emerald-100/60">
                <DollarSign className="w-7 h-7 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Ingresos del mes actual
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Turnos Completados</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {revenue?.completedCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100/50 flex items-center justify-center border border-violet-100/60">
                <TrendingUp className="w-7 h-7 text-violet-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Tasa de completado: <span className="font-semibold text-emerald-600">{completionRate}%</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Cancelados</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {revenue?.cancelledCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 flex items-center justify-center border border-red-100/60">
                <XCircle className="w-7 h-7 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Turnos cancelados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">No Asistieron</p>
                <p className="text-3xl font-semibold text-slate-900 mt-2 tracking-tight">
                  {revenue?.noShowCount ?? 0}
                </p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 flex items-center justify-center border border-amber-100/60">
                <UserX className="w-7 h-7 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4">
              Clientes sin asistencia
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-5 border-b border-slate-100/80">
          <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/50 flex items-center justify-center border border-violet-100/60">
              <BarChart3 className="w-5 h-5 text-violet-600" />
            </div>
            Desglose por Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {breakdown.length === 0 ? (
            <div className="text-center py-14">
              <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500">No hay datos para este período</p>
            </div>
          ) : (
            <div className="space-y-7">
              {breakdown.map((item, index) => {
                const maxCount = Math.max(...breakdown.map((b) => b.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={item.serviceId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-slate-400 w-5">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-slate-900 text-base tracking-tight">
                          {item.serviceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-5">
                        <span className="text-sm text-slate-500">
                          {item.count} turno{item.count !== 1 ? 's' : ''}
                        </span>
                        <span className="text-base font-semibold text-emerald-600 min-w-[100px] text-right tracking-tight">
                          {formatARS(item.revenue)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-500 ease-out"
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Turnos</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">{totalAppointments}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Pendientes</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">{revenue?.pendingCount ?? 0}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Promedio/Turno</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">
            {totalAppointments > 0 
              ? formatARS(Math.round((revenue?.totalRevenue ?? 0) / totalAppointments))
              : formatARS(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Ingresos Día</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 tracking-tight">
            {totalAppointments > 0 
              ? formatARS(Math.round((revenue?.totalRevenue ?? 0) / 30))
              : formatARS(0)}
          </p>
        </div>
      </div>
    </div>
  );
}
