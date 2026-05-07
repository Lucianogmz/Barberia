'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Scissors, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useApiToken } from '@/components/providers/token-provider';
import {
  getAllServices,
  createService,
  updateService,
  deleteService,
  type Service,
} from '@/lib/api-client';
import { formatARS } from '@/lib/formatters';
import { toast } from 'sonner';

export default function ServiciosPage() {
  const token = useApiToken();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const loadServices = async () => {
    if (!token) return;
    try {
      const data = await getAllServices(token);
      setServices(data);
    } catch (error) {
      toast.error('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [token]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormDuration('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setFormName(service.name);
    setFormDescription(service.description ?? '');
    setFormPrice(String(service.price));
    setFormDuration(String(service.durationMin));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      if (editing) {
        await updateService(token, editing.id, {
          name: formName,
          description: formDescription || undefined,
          price: parseFloat(formPrice),
          durationMin: parseInt(formDuration),
        } as any);
        toast.success('Servicio actualizado');
      } else {
        await createService(token, {
          name: formName,
          description: formDescription || undefined,
          price: parseFloat(formPrice),
          durationMin: parseInt(formDuration),
        } as any);
        toast.success('Servicio creado');
      }
      setDialogOpen(false);
      resetForm();
      await loadServices();
    } catch (error) {
      toast.error('Error al guardar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: Service) => {
    if (!token) return;
    try {
      await deleteService(token, service.id);
      toast.success(`"${service.name}" desactivado`);
      await loadServices();
    } catch (error) {
      toast.error('Error al desactivar el servicio');
    }
  };

  const handleReactivate = async (service: Service) => {
    if (!token) return;
    try {
      await updateService(token, service.id, { isActive: true } as any);
      toast.success(`"${service.name}" reactivado`);
      await loadServices();
    } catch (error) {
      toast.error('Error al reactivar el servicio');
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
          <h1 className="text-3xl font-bold text-white">Servicios</h1>
          <p className="text-white/50 mt-1">
            Administrá los servicios que ofrecés
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white h-9 px-4 py-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </DialogTrigger>
          <DialogContent className="bg-[#1a1a2e] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Editar servicio' : 'Nuevo servicio'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-white/70">Nombre</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Corte + Barba"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Descripción (opcional)</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Corte de cabello y arreglo de barba"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Precio (ARS)</Label>
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="5000"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Duración (min)</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="30"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={!formName || !formPrice || !formDuration || saving}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {editing ? 'Guardar cambios' : 'Crear servicio'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => (
          <Card
            key={service.id}
            className={`border-white/10 backdrop-blur-sm ${
              service.isActive ? 'bg-white/5' : 'bg-white/[0.02] opacity-60'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-purple-400" />
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
                  </div>
                </div>
                {!service.isActive && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span>{service.durationMin} min</span>
                  <span className="text-xl font-bold text-purple-400">
                    {formatARS(Number(service.price))}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(service)}
                    className="text-white/40 hover:text-white h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {service.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(service)}
                      className="text-white/40 hover:text-red-400 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReactivate(service)}
                      className="text-green-400/60 hover:text-green-400 text-xs"
                    >
                      Reactivar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
