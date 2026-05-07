'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CalendarDays,
  Search,
  Loader2,
  Phone,
  Mail,
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
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/formatters';
import { toast } from 'sonner';

export default function TurnosPage() {
  const token = useApiToken();
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [filterStatus, setFilterStatus] = useState<string>('');

  const loadAppointments = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getAppointments(token, selectedDate, filterStatus || undefined);
      setAppointments(data);
    } catch (error) {
      toast.error('Error al cargar los turnos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [token, selectedDate, filterStatus]);

  const handleStatusChange = async (id: string, status: string) => {
    if (!token) return;
    try {
      await updateAppointmentStatus(token, id, status);
      await loadAppointments();
      toast.success('Estado actualizado');
    } catch (error) {
      toast.error('Error al actualizar el estado');
    }
  };

  const statuses = ['', 'PENDIENTE', 'COMPLETADO', 'CANCELADO', 'NO_ASISTIO'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Turnos</h1>
        <p className="text-white/50 mt-1">
          Gestioná todos los turnos de tu barbería
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48 bg-white/5 border-white/10 text-white"
        />
        <div className="flex gap-1">
          {statuses.map((s) => (
            <Button
              key={s || 'all'}
              size="sm"
              variant="ghost"
              onClick={() => setFilterStatus(s)}
              className={`text-xs ${
                filterStatus === s
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              {s ? STATUS_LABELS[s] : 'Todos'}
            </Button>
          ))}
        </div>
      </div>

      {/* Appointments list */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-purple-400" />
            {formatDateES(selectedDate)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <p className="text-white/30 text-center py-12">
              No hay turnos para esta fecha
            </p>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-5 rounded-xl bg-white/5 border border-white/5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[70px] py-2 px-3 rounded-lg bg-white/5">
                        <p className="text-lg font-bold text-white">
                          {formatTimeES(apt.startTime)}
                        </p>
                        <p className="text-xs text-white/30">
                          {formatTimeES(apt.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-white text-lg">
                          {apt.client.name}
                        </p>
                        <p className="text-sm text-purple-400">
                          {apt.service.name}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-white/30">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {apt.client.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {apt.client.email}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={`${STATUS_COLORS[apt.status]} border text-xs`}>
                        {STATUS_LABELS[apt.status]}
                      </Badge>
                      <span className="text-lg font-bold text-white">
                        {formatARS(Number(apt.priceAtBooking))}
                      </span>
                    </div>
                  </div>

                  {apt.status === 'PENDIENTE' && (
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(apt.id, 'COMPLETADO')}
                        className="bg-green-600/20 text-green-400 hover:bg-green-600/30 text-xs"
                      >
                        ✓ Completar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(apt.id, 'NO_ASISTIO')}
                        className="bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 text-xs"
                      >
                        No asistió
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(apt.id, 'CANCELADO')}
                        className="bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
