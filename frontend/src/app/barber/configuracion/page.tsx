'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Sun, Moon, Save, Loader2, Info } from 'lucide-react';
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
    if (!token || token.length === 0) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data = await getSchedule(token);
        if (!cancelled) setSchedule(data);
      } catch {
        if (!cancelled) toast.error('Error al cargar el horario');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [token]);

  const updateDay = (dayOfWeek: number, field: string, value: any) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day,
      ),
    );
  };

  const updateMorning = (dayOfWeek: number, field: 'start' | 'end', value: string) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, morning: { ...day.morning, [field]: value } }
          : day,
      ),
    );
  };

  const updateAfternoon = (dayOfWeek: number, field: 'start' | 'end', value: string) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              afternoon: day.afternoon
                ? { ...day.afternoon, [field]: value }
                : { start: '17:00', end: '20:00' },
            }
          : day,
      ),
    );
  };

  const toggleAfternoon = (dayOfWeek: number) => {
    setSchedule((prev) =>
      prev.map((day) =>
        day.dayOfWeek === dayOfWeek
          ? {
              ...day,
              afternoon: day.afternoon
                ? null
                : { start: '17:00', end: '20:00' },
            }
          : day,
      ),
    );
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const data = schedule.map(({
        dayOfWeek,
        isActive,
        morning,
        afternoon,
      }) => ({
        dayOfWeek,
        isActive,
        morning,
        afternoon,
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
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
            Horario de Atención
          </h1>
          <p className="text-slate-500 mt-1.5 text-base">
            Configurá tus turnos de mañana y tarde
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-black hover:shadow-xl hover:shadow-slate-900/30 border border-white/10 ring-1 ring-inset ring-white/5 rounded-xl"
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
      <Card className="bg-white border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-5 border-b border-slate-100/80">
          <CardTitle className="text-base font-medium text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200/50">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            Turnos Semanales
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-1">
            {schedule.map((day, index) => (
              <div key={day.dayOfWeek}>
                <div className="flex flex-col gap-4 py-5">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateDay(day.dayOfWeek, 'isActive', !day.isActive)}
                      className={`w-36 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 text-left border
                        ${day.isActive
                          ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/30 border-slate-800'
                          : 'bg-slate-50/80 text-slate-500 border-slate-200/60 hover:border-slate-300 hover:bg-slate-100'
                        }`}
                    >
                      {DAY_NAMES[day.dayOfWeek]}
                    </button>

                    {day.isActive ? (
                      <div className="flex flex-col gap-4 flex-1">
                        {/* Morning shift */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-28">
                            <Sun className="w-4 h-4 text-amber-500" />
                            <Label className="text-slate-500 text-xs font-medium">Mañana</Label>
                          </div>
                          <Input
                            type="time"
                            value={day.morning.start}
                            onChange={(e) => updateMorning(day.dayOfWeek, 'start', e.target.value)}
                            className="w-32 bg-white/80 border-slate-200/60 text-slate-900 text-sm rounded-xl"
                          />
                          <span className="text-slate-300 font-light">—</span>
                          <Input
                            type="time"
                            value={day.morning.end}
                            onChange={(e) => updateMorning(day.dayOfWeek, 'end', e.target.value)}
                            className="w-32 bg-white/80 border-slate-200/60 text-slate-900 text-sm rounded-xl"
                          />
                        </div>

                        {/* Afternoon shift toggle */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-28">
                            <Moon className="w-4 h-4 text-slate-400" />
                            <Label className="text-slate-500 text-xs font-medium">Tarde</Label>
                          </div>
                          {day.afternoon ? (
                            <>
                              <Input
                                type="time"
                                value={day.afternoon.start}
                                onChange={(e) => updateAfternoon(day.dayOfWeek, 'start', e.target.value)}
                                className="w-32 bg-white/80 border-slate-200/60 text-slate-900 text-sm rounded-xl"
                              />
                              <span className="text-slate-300 font-light">—</span>
                              <Input
                                type="time"
                                value={day.afternoon.end}
                                onChange={(e) => updateAfternoon(day.dayOfWeek, 'end', e.target.value)}
                                className="w-32 bg-white/80 border-slate-200/60 text-slate-900 text-sm rounded-xl"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleAfternoon(day.dayOfWeek)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg ml-2"
                                title="Quitar turno de tarde"
                              >
                                <span className="text-xs">✕</span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAfternoon(day.dayOfWeek)}
                              className="border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:text-slate-600 rounded-xl text-xs"
                            >
                              + Agregar turno de tarde
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <Badge className="bg-slate-100/80 text-slate-400 border border-slate-200/60 text-xs font-medium rounded-lg">
                        Cerrado
                      </Badge>
                    )}
                  </div>
                </div>
                {index < schedule.length - 1 && (
                  <Separator className="bg-slate-100/80" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-slate-50/80 border border-slate-200/60">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 flex items-center justify-center flex-shrink-0 border border-blue-100/60">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Sobre el horario de atención
              </p>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Configurá tu turno de mañana y tarde por separado. Los horarios de la tarde son
                opcionales. Si no agregás un turno de tarde, solo se mostrarán los horarios de
                la mañana.
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Hay un <span className="font-medium text-slate-700">buffer de 10 minutos</span> entre cada turno.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
