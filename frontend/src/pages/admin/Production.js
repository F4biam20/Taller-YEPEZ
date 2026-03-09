import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { Wrench, User, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const shifts = [
  { value: "matutino", label: "Matutino (8:00 - 14:00)" },
  { value: "vespertino", label: "Vespertino (14:00 - 20:00)" }
];

export default function Production() {
  const { API, getAuthHeaders } = useAuth();
  const [services, setServices] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedMechanic, setSelectedMechanic] = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, mechanicsRes] = await Promise.all([
        axios.get(`${API}/services`, getAuthHeaders()),
        axios.get(`${API}/mechanics`, getAuthHeaders())
      ]);
      setServices(servicesRes.data);
      setMechanics(mechanicsRes.data.filter(m => m.active));
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedMechanic || !selectedShift) {
      toast.error("Selecciona mecánico y turno");
      return;
    }
    try {
      await axios.put(`${API}/services/${selectedService.id}`, {
        mechanic_id: selectedMechanic,
        shift: selectedShift,
        status: "en_reparacion"
      }, getAuthHeaders());
      toast.success("Servicio asignado exitosamente");
      setAssignDialogOpen(false);
      setSelectedService(null);
      setSelectedMechanic("");
      setSelectedShift("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al asignar");
    }
  };

  const openAssignDialog = (service) => {
    if (service.payment_status !== "pagado") {
      toast.error("El pago debe estar validado antes de asignar");
      return;
    }
    setSelectedService(service);
    setSelectedMechanic(service.mechanic_id || "");
    setSelectedShift(service.shift || "");
    setAssignDialogOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      recibido: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      diagnostico: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      en_reparacion: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      listo: "bg-green-500/20 text-green-400 border-green-500/30"
    };
    const labels = {
      recibido: "Recibido",
      diagnostico: "Diagnóstico",
      en_reparacion: "En Reparación",
      listo: "Listo"
    };
    return (
      <Badge variant="outline" className={cn("uppercase text-xs", styles[status] || styles.recibido)}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentBadge = (status) => {
    if (status === "pagado") {
      return (
        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 uppercase text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pagado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 uppercase text-xs">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="production-page">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
          Producción
        </h1>
        <p className="text-zinc-500 mt-1">Gestión de servicios y asignación de mecánicos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              {services.filter(s => s.status === "recibido").length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Recibidos</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-400" style={{ fontFamily: 'Barlow Condensed' }}>
              {services.filter(s => s.status === "en_reparacion").length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">En Reparación</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400" style={{ fontFamily: 'Barlow Condensed' }}>
              {services.filter(s => s.status === "listo").length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Listos</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
              {mechanics.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Mecánicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <Wrench className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No hay servicios en producción</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all" data-testid={`service-${service.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                        {service.vehicle_plate}
                      </h3>
                      {getStatusBadge(service.status)}
                      {getPaymentBadge(service.payment_status)}
                    </div>
                    <div className="text-sm text-zinc-400">
                      <span>{service.vehicle_model}</span>
                      <span className="mx-2">•</span>
                      <span>{service.client_name}</span>
                    </div>
                    {service.diagnosis && (
                      <p className="text-sm text-zinc-500">
                        <span className="text-zinc-400 font-medium">Diagnóstico:</span> {service.diagnosis}
                      </p>
                    )}
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Progreso</span>
                        <span className="text-white font-bold">{service.progress}%</span>
                      </div>
                      <Progress value={service.progress} className="h-2 bg-zinc-800" />
                    </div>

                    {/* Assigned Mechanic */}
                    {service.mechanic_name && (
                      <div className="flex items-center gap-4 text-sm text-zinc-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {service.mechanic_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Turno {service.shift}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest">Costo Estimado</p>
                      <p className="text-2xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
                        ${service.estimated_cost?.toLocaleString() || 0}
                      </p>
                    </div>
                    <Button
                      onClick={() => openAssignDialog(service)}
                      disabled={service.status === "listo"}
                      data-testid={`assign-service-${service.id}`}
                      className={cn(
                        "font-bold uppercase tracking-wider",
                        service.payment_status === "pagado"
                          ? "bg-[#E31837] hover:bg-[#C4122C] text-white"
                          : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      )}
                    >
                      <User className="w-4 h-4 mr-2" />
                      {service.mechanic_name ? "Reasignar" : "Asignar Mecánico"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Asignar Mecánico y Turno
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {selectedService && (
              <div className="p-4 bg-zinc-800/30 rounded-sm">
                <p className="text-white font-bold">{selectedService.vehicle_plate}</p>
                <p className="text-zinc-400 text-sm">{selectedService.vehicle_model} - {selectedService.client_name}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-zinc-400 text-xs uppercase tracking-widest">Mecánico</label>
              <Select value={selectedMechanic} onValueChange={setSelectedMechanic}>
                <SelectTrigger data-testid="select-mechanic" className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Seleccionar mecánico..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {mechanics.map(m => (
                    <SelectItem key={m.id} value={m.id} className="text-white hover:bg-zinc-800">
                      {m.name} {m.specialty && `(${m.specialty})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 text-xs uppercase tracking-widest">Turno</label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger data-testid="select-shift" className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Seleccionar turno..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  {shifts.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-white hover:bg-zinc-800">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAssign}
              data-testid="confirm-assign-btn"
              className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
            >
              Confirmar Asignación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
