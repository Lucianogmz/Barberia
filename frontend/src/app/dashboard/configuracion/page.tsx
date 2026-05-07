'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Clock, Save, Loader2, Info } from 'lucide-react';
import { useApiToken } from '@/components/providers/token-provider';
import { getSchedule, updateSchedule, type ScheduleDay } from '@/lib/api-client';
import { toast } from 'sonner';

const DAY_NAMES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function ConfiguracionPage() {
  const token = useApiToken();
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    getSchedule(token)
      .then(setSchedule)
      .catch(() => toast.error('Error al cargar el horario'))
      .finally(() => setLoading(false));
  }, [token]);

  const updateDay = (dayOfWeek: number, field: string, value: any) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day,
      ),
    );
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const data = schedule.map(({ dayOfWeek, startTime, endTime, isActive }) => ({
        dayOfWeek,
        startTime,
        endTime,
        isActive,
      }));
      const updated = await updateSchedule(token, data);
      setSchedule(updated);
      toast.success('Horario guardado con éxito');
    } catch (error) {
      toast.error('Error al guardar el horario');
    } finally {
      setSaving(false);
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
    <div className="space-y-8 p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
          <p className="text-slate-500 mt-1">
            Configurá tu horario de atención semanal
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>

      {/* Schedule Card */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-600" />
            Horario de Atención
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-1">
            {schedule.map((day, index) => (
              <div key={day.dayOfWeek}>
                <div className="flex items-center gap-4 py-4">
                  {/* Day toggle */}
                  <button
                    onClick={() => updateDay(day.dayOfWeek, 'isActive', !day.isActive)}
                    className={`w-36 py-2.5 px-4 rounded-lg text-sm font-medium transition-all text-left
                      ${day.isActive
                        ? 'bg-violet-50 text-violet-700 border border-violet-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}
                  >
                    {DAY_NAMES[day.dayOfWeek]}
                  </button>

                  {/* Time inputs */}
                  {day.isActive ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-slate-500 text-xs">Desde</Label>
                        <Input
                          type="time"
                          value={day.startTime}
                          onChange={(e) =>
                            updateDay(day.dayOfWeek, 'startTime', e.target.value)
                          }
                          className="w-32 bg-white border-slate-200 text-slate-900 text-sm"
                        />
                      </div>
                      <span className="text-slate-300">—</span>
                      <div className="flex items-center gap-2">
                        <Label className="text-slate-500 text-xs">Hasta</Label>
                        <Input
                          type="time"
                          value={day.endTime}
                          onChange={(e) =>
                            updateDay(day.dayOfWeek, 'endTime', e.target.value)
                          }
                          className="w-32 bg-white border-slate-200 text-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <Badge className="bg-slate-100 text-slate-400 border-slate-200 text-xs">
                      Cerrado
                    </Badge>
                  )}
                </div>
                {index < schedule.length - 1 && (
                  <Separator className="bg-slate-100" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Sobre el horario de atención
              </p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Los turnos se generan automáticamente según este horario. Si
                bloqueás un horario en tu Google Calendar, ese tiempo también
                quedará no disponible para los clientes.
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Hay un <span className="font-medium text-slate-700">buffer de 10 minutos</span> entre cada turno.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}