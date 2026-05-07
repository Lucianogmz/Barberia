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
  STATUS_COLORS,
} from '@/lib/formatters';
import { toast } from 'sonner';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Turnos</h1>
        <p className="text-black/50 mt-1">
          Gestioná todos los turnos de tu barbería
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handlePrevDays} className="text-black/50 hover:text-black">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="text-black/70 text-sm">
          {formatDateShort(dates[0])} - {formatDateShort(dates[2])}
        </span>
        <Button variant="ghost" size="icon" onClick={handleNextDays} className="text-black/50 hover:text-black">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* Appointments for each day - Stacked vertically */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-black animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {dates.map((date, idx) => {
            const dayAppointments = allAppointments[date] || [];
            const isToday = idx === 0;
            return (
              <Card key={date} className="border-2 border-black bg-white shadow-sm">
                <CardHeader className={`pb-3 ${isToday ? 'bg-black/5 -mx-6 -mt-6 px-6 py-4 rounded-t-xl' : ''}`}>
                  <CardTitle className="text-black text-lg flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-black" />
                    {dateLabels[idx]} - {formatDateES(date)}
                    <Badge variant="outline" className="ml-auto border-black/20 text-black/50 text-xs">
                      {dayAppointments.length} {dayAppointments.length === 1 ? 'turno' : 'turnos'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dayAppointments.length === 0 ? (
                    <p className="text-black/30 text-center py-6 text-sm">
                      No hay turnos
                    </p>
                  ) : (
                    dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="p-4 rounded-xl bg-black/5 border border-black/5 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-center min-w-[60px] py-1.5 px-2 rounded-lg bg-black/5">
                              <p className="text-base font-bold text-black">
                                {formatTimeES(apt.startTime)}
                              </p>
                              <p className="text-xs text-black/30">
                                {formatTimeES(apt.endTime)}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-black">
                                {apt.client.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {apt.service.name}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-black/30">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {apt.client.phone}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge className={`${STATUS_COLORS[apt.status]} border text-xs`}>
                              {STATUS_LABELS[apt.status]}
                            </Badge>
                            <span className="text-base font-bold text-black">
                              {formatARS(Number(apt.priceAtBooking))}
                            </span>
                          </div>
                        </div>

                        {apt.status === 'PENDIENTE' && (
                          <div className="flex gap-2 pt-2 border-t border-black/5">
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(apt.id, 'COMPLETADO')}
                              className="bg-green-600/20 text-green-600 hover:bg-green-600/30 text-xs h-7"
                            >
                              ✓ Completar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(apt.id, 'NO_ASISTIO')}
                              className="bg-orange-600/20 text-orange-600 hover:bg-orange-600/30 text-xs h-7"
                            >
                              No asistió
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(apt.id, 'CANCELADO')}
                              className="bg-red-600/20 text-red-600 hover:bg-red-600/30 text-xs h-7"
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
