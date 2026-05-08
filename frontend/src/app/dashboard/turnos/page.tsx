'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CalendarDays,
  Loader2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApiToken } from '@/components/providers/token-provider';
import {
  getAppointments,
  updateAppointmentStatus,
  type AppointmentResponse,
} from '@/lib/api-client';
import {
  formatARS,
  formatTimeES,
  formatDateES,
  formatDateShort,
  toDateString,
  getTodayDateString,
  STATUS_LABELS,
} from '@/lib/formatters';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  PENDIENTE: 'bg-amber-50/80 text-amber-700 border-amber-200/50 font-medium',
  COMPLETADO: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 font-medium',
  CANCELADO: 'bg-red-50/80 text-red-700 border-red-200/50 font-medium',
  NO_ASISTIO: 'bg-orange-50/80 text-orange-700 border-orange-200/50 font-medium',
};

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00-03:00');
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

export default function TurnosPage() {
  const token = useApiToken();
  const [allAppointments, setAllAppointments] = useState<Record<string, AppointmentResponse[]>>({});
  const [loading, setLoading] = useState(true);
  const [tokenReady, setTokenReady] = useState(false);
  const [baseDate, setBaseDate] = useState(getTodayDateString());

  const dates = [baseDate, addDays(baseDate, 1), addDays(baseDate, 2)];
  const dateLabels = ['Hoy', 'Mañana', 'Pasado mañana'];

  useEffect(() => {
    if (token) {
      setTokenReady(true);
    } else {
      const stored = localStorage.getItem('barberia_api_token');
      if (stored) {
        setTokenReady(true);
      }
    }
  }, [token]);

  const loadAppointmentsForDate = async (date: string): Promise<AppointmentResponse[]> => {
    const effectiveToken = token || localStorage.getItem('barberia_api_token');
    if (!effectiveToken) return [];
    try {
      return await getAppointments(effectiveToken, date, undefined);
    } catch (error) {
      console.error(`Error loading for ${date}:`, error);
      return [];
    }
  };

  const loadAllAppointments = async () => {
    setLoading(true);
    const results: Record<string, AppointmentResponse[]> = {};
    for (const date of dates) {
      results[date] = await loadAppointmentsForDate(date);
    }
    setAllAppointments(results);
    setLoading(false);
  };

  useEffect(() => {
    if (tokenReady && (token || localStorage.getItem('barberia_api_token'))) {
      loadAllAppointments();
    }
  }, [tokenReady, token, baseDate]);

  const handleStatusChange = async (id: string, status: string) => {
    const effectiveToken = token || localStorage.getItem('barberia_api_token');
    if (!effectiveToken) return;
    try {
      await updateAppointmentStatus(effectiveToken, id, status);
      await loadAllAppointments();
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const handlePrevDays = () => setBaseDate(addDays(baseDate, -3));
  const handleNextDays = () => setBaseDate(addDays(baseDate, 3));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Turnos</h1>
        <p className="text-slate-500 mt-1.5 text-base">
          Gestioná todos los turnos de tu barbería
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrevDays} className="rounded-xl border-slate-200/60 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-slate-600 text-sm font-medium min-w-[180px] text-center">
          {formatDateShort(dates[0])} - {formatDateShort(dates[2])}
        </span>
        <Button variant="outline" size="icon" onClick={handleNextDays} className="rounded-xl border-slate-200/60 text-slate-500 hover:text-slate-900 hover:bg-slate-100">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Appointments for each day */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date, idx) => {
            const dayAppointments = allAppointments[date] || [];
            const isToday = idx === 0;
            return (
              <Card key={date} className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <CardHeader className={`pb-4 ${isToday ? 'bg-gradient-to-r from-slate-50 to-slate-50/50 -mx-6 -mt-5 px-6 py-4 rounded-t-2xl border-b border-slate-100/80' : 'border-b border-slate-100/80'}`}>
                  <CardTitle className="text-slate-900 text-base font-medium flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-slate-500" />
                    {dateLabels[idx]} - {formatDateES(date)}
                    <Badge variant="outline" className="ml-auto border-slate-200/80 text-slate-500 text-xs font-medium bg-slate-50/80">
                      {dayAppointments.length} {dayAppointments.length === 1 ? 'turno' : 'turnos'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-5">
                  {dayAppointments.length === 0 ? (
                    <p className="text-slate-300 text-center py-10 text-sm">
                      No hay turnos
                    </p>
                  ) : (
                    dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-5 rounded-2xl bg-slate-50/80 border border-slate-100/80 space-y-4 hover:bg-slate-100/60 hover:border-slate-200/80 hover:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] transition-all duration-300"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-center min-w-[70px] py-3 px-3 rounded-xl bg-white border border-slate-200/50 shadow-sm">
                              <p className="text-base font-semibold text-slate-900 tracking-tight">
                                {formatTimeES(apt.startTime)}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {formatTimeES(apt.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900 text-base">{apt.client.name}</p>
                              <p className="text-sm text-slate-500 mt-0.5">{apt.service.name}</p>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {apt.client.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2.5">
                            <Badge className={`${STATUS_COLORS[apt.status]} border text-xs`}>
                              {STATUS_LABELS[apt.status]}
                            </Badge>
                            <span className="text-lg font-semibold text-slate-900 tracking-tight">
                              {formatARS(Number(apt.priceAtBooking))}
                            </span>
                          </div>
                        </div>

                        {apt.status === 'PENDIENTE' && (
                          <div className="flex gap-2.5 pt-3 border-t border-slate-100/80">
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
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
