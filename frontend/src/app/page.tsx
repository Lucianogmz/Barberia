'use client';

import { useState, useEffect } from 'react';
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
  // Booking state
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

  // Load services on mount
  useEffect(() => {
    getServices()
      .then(setServices)
      .catch(() => toast.error('Error al cargar los servicios'));
  }, []);

  // Load available slots when date or service changes
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

  // Submit booking
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
    } catch (error: any) {
      toast.error(error.message || 'Error al reservar el turno');
    } finally {
      setLoading(false);
    }
  };

  // Reset booking
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
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#111128] to-[#0a0a1a] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Barbería</h1>
            <p className="text-sm text-white/40">Reservá tu turno online</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        {step !== 'confirmation' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {['service', 'datetime', 'info'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                    ${step === s
                      ? 'bg-purple-500 text-white scale-110'
                      : ['service', 'datetime', 'info'].indexOf(step) > i
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-white/30 border border-white/10'
                    }`}
                >
                  {i + 1}
                </div>
                {i < 2 && (
                  <div
                    className={`w-12 h-0.5 transition-all ${
                      ['service', 'datetime', 'info'].indexOf(step) > i
                        ? 'bg-purple-500/50'
                        : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Service Selection */}
        {step === 'service' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Elegí tu servicio
              </h2>
              <p className="text-white/50">
                Seleccioná el servicio que necesitás
              </p>
            </div>

            <div className="grid gap-4">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={`cursor-pointer transition-all duration-200 hover:scale-[1.02] border-white/10 bg-white/5 backdrop-blur-sm
                    ${selectedService?.id === service.id
                      ? 'ring-2 ring-purple-500 border-purple-500/50 bg-purple-500/10'
                      : 'hover:border-white/20 hover:bg-white/8'
                    }`}
                  onClick={() => setSelectedService(service)}
                >
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center
                        ${selectedService?.id === service.id
                          ? 'bg-purple-500/20'
                          : 'bg-white/5'
                        }`}
                      >
                        <Scissors className={`w-5 h-5 ${
                          selectedService?.id === service.id
                            ? 'text-purple-400'
                            : 'text-white/40'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-sm text-white/40">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-sm text-white/50">
                            <Clock className="w-3.5 h-3.5" />
                            {service.durationMin} min
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-purple-400">
                      {formatARS(service.price)}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedService && (
              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep('datetime')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 'datetime' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('service')}
                className="text-white/50 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Elegí fecha y hora
                </h2>
                <p className="text-white/50">
                  {selectedService?.name} — {selectedService?.durationMin} min
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Calendar */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-purple-400" />
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
                    className="rounded-md"
                  />
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    Horarios disponibles
                    {selectedDate && !slotsLoading && (
                      <Badge variant="secondary" className="ml-auto bg-white/10 text-white/60">
                        {availableCount} disponibles
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedDate ? (
                    <p className="text-white/30 text-sm text-center py-8">
                      Seleccioná una fecha para ver los horarios
                    </p>
                  ) : slotsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                    </div>
                  ) : availableCount === 0 ? (
                    <p className="text-white/30 text-sm text-center py-8">
                      No hay horarios disponibles para esta fecha
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {availableSlots
                        .filter((slot) => slot.available)
                        .map((slot) => (
                          <button
                            key={slot.startTime}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                              ${selectedSlot?.startTime === slot.startTime
                                ? 'bg-purple-500 text-white ring-2 ring-purple-400/50'
                                : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
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
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Client Information */}
        {step === 'info' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep('datetime')}
                className="text-white/50 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Volver
              </Button>
              <div>
                <h2 className="text-2xl font-bold text-white">Tus datos</h2>
                <p className="text-white/50">
                  Completá tus datos para confirmar el turno
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Guest Form */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardContent className="pt-6 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white/70 flex items-center gap-2">
                      <User className="w-4 h-4" /> Nombre completo
                    </Label>
                    <Input
                      id="name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/70 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="11 2345-6789"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white/70 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="juan@email.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              <Card className="border-white/10 bg-white/5 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white text-base">
                    Resumen de tu turno
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Servicio</span>
                      <span className="text-white font-medium">
                        {selectedService?.name}
                      </span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Fecha</span>
                      <span className="text-white font-medium">
                        {selectedDate && formatDateES(selectedDate)}
                      </span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Horario</span>
                      <span className="text-white font-medium">
                        {selectedSlot && formatTimeES(selectedSlot.startTime)}
                        {' — '}
                        {selectedSlot && formatTimeES(selectedSlot.endTime)}
                      </span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Duración</span>
                      <span className="text-white font-medium">
                        {selectedService?.durationMin} minutos
                      </span>
                    </div>
                    <Separator className="bg-white/10" />
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-white/70 font-medium">Total</span>
                      <span className="text-2xl font-bold text-purple-400">
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 disabled:opacity-50"
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

        {/* Step 4: Confirmation */}
        {step === 'confirmation' && (
          <div className="text-center py-16 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              ¡Turno confirmado!
            </h2>
            <p className="text-white/50 max-w-md mx-auto">
              Tu turno ha sido reservado con éxito. Te enviamos un email de
              confirmación con los detalles.
            </p>

            <Card className="max-w-sm mx-auto border-white/10 bg-white/5 backdrop-blur-sm">
              <CardContent className="pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Servicio</span>
                  <span className="text-white font-medium">
                    {selectedService?.name}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Fecha</span>
                  <span className="text-white font-medium">
                    {selectedDate && formatDateES(selectedDate)}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Hora</span>
                  <span className="text-white font-medium">
                    {selectedSlot && formatTimeES(selectedSlot.startTime)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={resetBooking}
              variant="outline"
              className="mt-8 border-white/20 text-white hover:bg-white/10"
            >
              Reservar otro turno
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 mt-16">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-white/20">
            © {new Date().getFullYear()} Barbería — Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
