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
        <Loader2 className="w-8 h-8 text-slate-300 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Servicios</h1>
          <p className="text-slate-500 mt-1.5 text-base">
            Administrá los servicios que ofrecés
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-black hover:shadow-xl hover:shadow-slate-900/30 h-10 px-5 py-2 cursor-pointer border border-white/10 ring-1 ring-inset ring-white/5 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Nuevo servicio
          </DialogTrigger>
          <DialogContent className="bg-white border border-slate-200/60 text-slate-900 rounded-2xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-medium text-slate-900">
                {editing ? 'Editar servicio' : 'Nuevo servicio'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-5">
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm font-medium">Nombre</Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Corte + Barba"
                  className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600 text-sm font-medium">Descripción (opcional)</Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Corte de cabello y arreglo de barba"
                  className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-600 text-sm font-medium">Precio (ARS)</Label>
                  <Input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="5000"
                    className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-600 text-sm font-medium">Duración (min)</Label>
                  <Input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="30"
                    className="bg-white/80 border-slate-200/60 text-slate-900 placeholder:text-slate-400/60 rounded-xl"
                  />
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={!formName || !formPrice || !formDuration || saving}
                className="w-full bg-gradient-to-b from-slate-900 to-black text-white shadow-lg shadow-slate-900/20 hover:from-slate-800 hover:to-black border border-white/10 ring-1 ring-inset ring-white/5 rounded-xl"
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
      <div className="grid gap-5 md:grid-cols-2">
        {services.map((service) => (
          <Card
            key={service.id}
            className={`border border-slate-200/60 transition-all duration-300 hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_12px_25px_-2px_rgba(0,0,0,0.06)] ${
              service.isActive ? 'bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]' : 'bg-slate-50/50 shadow-none opacity-70'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center border border-slate-200/50">
                    <Scissors className="w-5 h-5 text-slate-600" />
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
                  </div>
                </div>
                {!service.isActive && (
                  <Badge className="bg-red-50/80 text-red-600 border border-red-200/50 text-xs font-medium rounded-lg">
                    Inactivo
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100/80">
                <div className="flex items-center gap-5 text-sm text-slate-500">
                  <span>{service.durationMin} min</span>
                  {editingPrice === service.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        className="w-28 h-9 bg-white border-slate-200/60 text-slate-900 text-lg font-semibold rounded-xl"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') savePrice(service);
                          if (e.key === 'Escape') cancelEditPrice();
                        }}
                      />
                      <Button size="sm" onClick={() => savePrice(service)} className="h-9 w-9 p-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-500/20">
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditPrice} className="h-9 w-9 p-0 text-slate-400 hover:text-slate-600 rounded-lg">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="text-xl font-semibold text-slate-900 cursor-pointer hover:text-slate-700 tracking-tight transition-colors"
                      onClick={() => startEditPrice(service)}
                      title="Click para editar precio"
                    >
                      {formatARS(Number(service.price))}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(service)}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 h-8 w-8 p-0 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {service.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(service)}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50/80 h-8 w-8 p-0 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReactivate(service)}
                      className="text-emerald-600/70 hover:text-emerald-600 hover:bg-emerald-50/80 text-xs rounded-lg transition-all"
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
