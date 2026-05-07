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
  Clock,
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
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Ingresos</h1>
        <p className="text-white/50 mt-1">
          Métricas financieras y desglose por servicio
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="text-white/50 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-semibold text-white min-w-[200px] text-center">
          {getMonthNameES(month)} {year}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="text-white/50 hover:text-white"
          disabled={year >= now.getFullYear() && month >= now.getMonth() + 1}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Ingresos totales</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatARS(revenue?.totalRevenue ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Turnos completados</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {revenue?.completedCount ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-xs text-white/30 mt-3">
              Tasa de completado: {completionRate}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">Cancelados</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {revenue?.cancelledCount ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">No asistieron</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {revenue?.noShowCount ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <UserX className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Breakdown */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Desglose por servicio
          </CardTitle>
        </CardHeader>
        <CardContent>
          {breakdown.length === 0 ? (
            <p className="text-white/30 text-center py-8">
              No hay datos para este período
            </p>
          ) : (
            <div className="space-y-4">
              {breakdown.map((item, index) => {
                const maxCount = Math.max(...breakdown.map((b) => b.count));
                const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                return (
                  <div key={item.serviceId} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-white/30 text-xs w-4">
                          #{index + 1}
                        </span>
                        <span className="font-medium text-white">
                          {item.serviceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-white/50">
                          {item.count} turnos
                        </span>
                        <span className="font-bold text-green-400 min-w-[100px] text-right">
                          {formatARS(item.revenue)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
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
    </div>
  );
}
