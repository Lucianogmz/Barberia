'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Scissors, Plus, Pencil, Trash2, Loader2, Check, X } from 'lucide-react';
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
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState('');

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

  const startEditPrice = (service: Service) => {
    setEditingPrice(service.id);
    setPriceValue(String(service.price));
  };

  const savePrice = async (service: Service) => {
    if (!token) return;
    const newPrice = parseFloat(priceValue);
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error('Precio inválido');
      return;
    }
    try {
      await updateService(token, service.id, { price: newPrice } as any);
      toast.success('Precio actualizado');
      await loadServices();
    } catch (error) {
      toast.error('Error al actualizar el precio');
    } finally {
      setEditingPrice(null);
    }
  };

  const cancelEditPrice = () => {
    setEditingPrice(null);
    setPriceValue('');
  };

  if (loading || !token) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">Servicios</h1>
          <p className="text-black/50 mt-1">
            Administrá los servicios que ofrecés
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium bg-black hover:bg-black/80 text-white h-9 px-4 py-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </DialogTrigger>
          <DialogContent className="bg-white border-black/10 text-black">
            <DialogHeader>
              <DialogTitle>
                {editing ? 'Editar servicio' : 'Nuevo servicio'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-black/70">Nombre</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Corte + Barba"
                  className="bg-black/5 border-black/10 text-black"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-black/70">Descripción (opcional)</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Corte de cabello y arreglo de barba"
                  className="bg-black/5 border-black/10 text-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black/70">Precio (ARS)</Label>
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="5000"
                    className="bg-black/5 border-black/10 text-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-black/70">Duración (min)</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="30"
                    className="bg-black/5 border-black/10 text-black"
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={!formName || !formPrice || !formDuration || saving}
                className="w-full bg-black hover:bg-black/80 text-white"
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
            className={`border-black/10 backdrop-blur-sm ${
              service.isActive ? 'bg-white' : 'bg-black/[0.02] opacity-60'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black text-lg">
                      {service.name}
                    </h3>
                    {service.description && (
                      <p className="text-sm text-black/40">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
                {!service.isActive && (
                  <Badge className="bg-red-500/20 text-red-600 border-red-500/30 text-xs">
                    Inactivo
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-sm text-black/50">
                  <span>{service.durationMin} min</span>
                  {editingPrice === service.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        className="w-24 h-8 bg-black/10 border-black/20 text-black text-lg font-bold"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') savePrice(service);
                          if (e.key === 'Escape') cancelEditPrice();
                        }}
                      />
                      <Button size="sm" onClick={() => savePrice(service)} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditPrice} className="h-8 w-8 p-0 text-black/40 hover:text-black">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="text-xl font-bold text-black cursor-pointer hover:text-black/70"
                      onClick={() => startEditPrice(service)}
                      title="Click para editar precio"
                    >
                      {formatARS(Number(service.price))}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(service)}
                    className="text-black/40 hover:text-black h-8 w-8 p-0"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {service.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(service)}
                      className="text-black/40 hover:text-red-600 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReactivate(service)}
                      className="text-green-600/60 hover:text-green-600 text-xs"
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
