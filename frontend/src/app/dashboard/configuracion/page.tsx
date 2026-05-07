'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Clock, Save, Loader2 } from 'lucide-react';
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
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuración</h1>
          <p className="text-white/50 mt-1">
            Configurá tu horario de atención semanal
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar cambios
        </Button>
      </div>

      <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            Horario de atención
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {schedule.map((day, index) => (
            <div key={day.dayOfWeek}>
              <div className="flex items-center gap-4 py-3">
                {/* Day toggle */}
                <button
                  onClick={() => updateDay(day.dayOfWeek, 'isActive', !day.isActive)}
                  className={`w-32 py-2 px-4 rounded-lg text-sm font-medium transition-all text-left
                    ${day.isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                >
                  {DAY_NAMES[day.dayOfWeek]}
                </button>

                {/* Time inputs */}
                {day.isActive ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-white/40 text-xs">Desde</Label>
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) =>
                          updateDay(day.dayOfWeek, 'startTime', e.target.value)
                        }
                        className="w-32 bg-white/5 border-white/10 text-white text-sm"
                      />
                    </div>
                    <span className="text-white/20">—</span>
                    <div className="flex items-center gap-2">
                      <Label className="text-white/40 text-xs">Hasta</Label>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) =>
                          updateDay(day.dayOfWeek, 'endTime', e.target.value)
                        }
                        className="w-32 bg-white/5 border-white/10 text-white text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <Badge className="bg-white/5 text-white/20 border-white/10 text-xs">
                    Cerrado
                  </Badge>
                )}
              </div>
              {index < schedule.length - 1 && (
                <Separator className="bg-white/5" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-white/10 bg-blue-500/5 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm text-white/70 font-medium">
                Sobre el horario de atención
              </p>
              <p className="text-xs text-white/40 mt-1">
                Los turnos se generan automáticamente según este horario. Si
                bloqueás un horario en tu Google Calendar, ese tiempo también
                quedará no disponible para los clientes. Hay un buffer de 10
                minutos entre cada turno.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
