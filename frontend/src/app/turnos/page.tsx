'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import {
  Scissors,
  Clock,
  CalendarDays,
  User,
  Phone,
  Mail,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  getServices,
  getAvailableSlots,
  createAppointment,
  type Service,
  type TimeSlot,
} from '@/lib/api-client';
import { formatARS, formatTimeES, formatDateES, toDateString } from '@/lib/formatters';

type BookingStep = 'service' | 'datetime' | 'info' | 'confirmation';

export default function BookingPage() {
  const router = useRouter();

  const [step, setStep] = useState<BookingStep>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => toast.error('Error al cargar los servicios'));
  }, []);

  useEffect(() => {
    if (selectedDate && selectedService) {
      setSlotsLoading(true);
      const dateStr = toDateString(selectedDate);
      getAvailableSlots(dateStr, selectedService.id)
        .then((slots) => {
          setAvailableSlots(slots);
          setSelectedSlot(null);
        })
        .catch(() => toast.error('Error al cargar los horarios disponibles'))
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedDate, selectedService]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot) return;

    setLoading(true);
    try {
      await createAppointment({
        serviceId: selectedService.id,
        startTime: selectedSlot.startTime,
        clientName,
        clientPhone,
        clientEmail,
      });
      setStep('confirmation');
      toast.success('¡Turno reservado con éxito!');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Error al reservar el turno');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setStep('service');
    setSelectedService(null);
    setSelectedDate(undefined);
    setSelectedSlot(null);
    setClientName('');
    setClientPhone('');
    setClientEmail('');
  };

  const availableCount = availableSlots.filter((s) => s.available).length;

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-slate-100/50 to-slate-200/30 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-slate-200/40 to-slate-100/30 blur-3xl" />

      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-900 to-black flex items-center justify-center shadow-lg shadow-slate-900/20">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight">Barbería</h1>
            <p className="text-sm text-slate-500">Reservá tu turno online</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 py-10">
        {step !== 'confirmation' && (
          <div className="flex items-center justify-center gap-3 mb-10">
            {['service', 'datetime', 'info'].map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-medium transition-all duration-300
                    ${step === s
                      ? 'bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/30 ring-1 ring-inset ring-white/10'
                      : ['service', 'datetime', 'info'].indexOf(step) > i
                      ? 'bg-slate-200/60 text-slate-600 border border-slate-300/50'
                      : 'bg-slate-100 text-slate-400 border border-slate-200/60'
                    }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-14 h-0.5 rounded-full transition-all duration-500 ${
                      ['service', 'datetime', 'info'].indexOf(step) > i
                        ? 'bg-slate-400'
                        : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 'service' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-2 tracking-tight">
                Elegí tu servicio
              </h2>
              <p className="text-slate-500">
                Seleccioná el servicio que necesitás
              </p>
            </div>

            <div className="grid gap-4">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] border-slate-200/60 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]
                    ${selectedService?.id === service.id
                      ? 'ring-2 ring-slate-900/20 border-slate-300/80 bg-slate-50/50'
                      : 'hover:border-slate-300/80'
                    }`}
                  onClick={() => {
                    setSelectedService(service);
                    setStep('datetime');
                  }}
                >
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300
                        ${selectedService?.id === service.id
                          ? 'bg-slate-900/10 border-slate-300/50'
                          : 'bg-slate-100/80 border-slate-200/60'
                        }`}
                      >
                        <Scissors className={`w-5 h-5 ${
                          selectedService?.id === service.id
                            ? 'text-slate-900'
                            : 'text-slate-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-slate-900 text-lg tracking-tight">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-slate-500 mt-0.5">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMin} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-semibold text-slate-900 tracking-tight">
                      {formatARS(service.price)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 'datetime' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('service')}
                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
                  Elegí fecha y hora
                </h2>
                <p className="text-slate-500">
                  {selectedService?.name} — {selectedService?.durationMin} min
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Card className="border-slate-200/60 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-base font-medium flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-slate-500" />
                    Fecha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const maxDate = new Date();
                      maxDate.setDate(maxDate.getDate() + 30);
                      return date < today || date > maxDate || date.getDay() === 0;
                    }}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200/60 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-base font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Horarios disponibles
                    {selectedDate && !slotsLoading && (
                      <Badge variant="secondary" className="ml-auto bg-slate-100 text-slate-600 border border-slate-200/60 text-xs font-medium">
                        {availableCount} disponibles
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <p className="text-slate-400 text-sm text-center py-10">
                      Seleccioná una fecha para ver los horarios
                    </p>
                  ) : slotsLoading ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    </div>
                  ) : availableCount === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-10">
                      No hay horarios disponibles para esta fecha
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
                      {availableSlots
                        .filter((slot) => slot.available)
                        .map((slot) => (
                          <button
                            key={slot.startTime}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border
                              ${selectedSlot?.startTime === slot.startTime
                                ? 'bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/30 border-slate-800'
                                : 'bg-slate-50/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300/80 border-slate-200/60'
                              }`}
                          >
                            {formatTimeES(slot.startTime)}
                          </button>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {selectedSlot && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep('info')}
                  className="bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-black hover:shadow-xl hover:shadow-slate-900/30 border border-white/10 ring-1 ring-inset ring-white/5 rounded-xl px-6"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {step === 'info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('datetime')}
                className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div>
                <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Tus datos</h2>
                <p className="text-slate-500">
                  Completá tus datos para confirmar el turno
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Card className="border-slate-200/60 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-600 text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" /> Nombre completo
                    </Label>
                    <Input
                      id="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-600 text-sm font-medium flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="11 2345-6789"
                      className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-600 text-sm font-medium flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="juan@email.com"
                      className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
                <CardHeader>
                  <CardTitle className="text-slate-900 text-base font-medium">
                    Resumen de tu turno
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Servicio</span>
                      <span className="text-slate-900 font-medium">
                        {selectedService?.name}
                      </span>
                    </div>
                    <Separator className="bg-slate-100/80" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Fecha</span>
                      <span className="text-slate-900 font-medium">
                        {selectedDate && formatDateES(selectedDate)}
                      </span>
                    </div>
                    <Separator className="bg-slate-100/80" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Horario</span>
                      <span className="text-slate-900 font-medium">
                        {selectedSlot && formatTimeES(selectedSlot.startTime)}
                        {' — '}
                        {selectedSlot && formatTimeES(selectedSlot.endTime)}
                      </span>
                    </div>
                    <Separator className="bg-slate-100/80" />
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Duración</span>
                      <span className="text-slate-900 font-medium">
                        {selectedService?.durationMin} minutos
                      </span>
                    </div>
                    <Separator className="bg-slate-100/80" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-700 font-medium">Total</span>
                      <span className="text-2xl font-semibold text-slate-900 tracking-tight">
                        {selectedService && formatARS(selectedService.price)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                disabled={!clientName || !clientPhone || !clientEmail || loading}
                className="bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-black hover:shadow-xl hover:shadow-slate-900/30 border border-white/10 ring-1 ring-inset ring-white/5 rounded-xl px-8 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Confirmar turno
              </Button>
            </div>
          </div>
        )}

        {step === 'confirmation' && (
          <div className="text-center py-16 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 flex items-center justify-center mb-6 border border-emerald-100/60 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-semibold text-slate-900 tracking-tight">
              ¡Turno confirmado!
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Tu turno ha sido reservado con éxito. Te enviamos un email de
              confirmación con los detalles.
            </p>

            <Card className="max-w-sm mx-auto border-slate-200/60 bg-slate-50/50 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Servicio</span>
                  <span className="text-slate-900 font-medium">
                    {selectedService?.name}
                  </span>
                </div>
                <Separator className="bg-slate-100/80" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fecha</span>
                  <span className="text-slate-900 font-medium">
                    {selectedDate && formatDateES(selectedDate)}
                  </span>
                </div>
                <Separator className="bg-slate-100/80" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Hora</span>
                  <span className="text-slate-900 font-medium">
                    {selectedSlot && formatTimeES(selectedSlot.startTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={resetBooking}
              variant="outline"
              className="mt-8 border-slate-200/60 text-slate-700 hover:bg-slate-100 hover:border-slate-300/80 rounded-xl"
            >
              Reservar otro turno
            </Button>
          </div>
        )}
      </main>

      <footer className="relative z-10 border-t border-slate-200/60 mt-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Barbería — Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
