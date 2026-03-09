import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import axios from "axios";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Trash2, ArrowRight, Phone, Mail, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const serviceTypes = [
  "Servicio Mayor",
  "Servicio Menor",
  "Cambio de Aceite",
  "Afinación",
  "Diagnóstico",
  "Reparación General",
  "Frenos",
  "Suspensión",
  "Sistema Eléctrico"
];

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export default function Appointments() {
  const { API, getAuthHeaders } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    vehicle_plate: "",
    vehicle_model: "",
    vehicle_year: "",
    service_type: "",
    description: "",
    scheduled_date: "",
    scheduled_time: ""
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get(`${API}/appointments`, getAuthHeaders());
      setAppointments(response.data);
    } catch (error) {
      toast.error("Error al cargar citas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        scheduled_date: format(date, "yyyy-MM-dd"),
        vehicle_year: formData.vehicle_year ? parseInt(formData.vehicle_year) : null
      };
      await axios.post(`${API}/appointments`, payload, getAuthHeaders());
      toast.success("Cita creada exitosamente");
      setDialogOpen(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear cita");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta cita?")) return;
    try {
      await axios.delete(`${API}/appointments/${id}`, getAuthHeaders());
      toast.success("Cita eliminada");
      fetchAppointments();
    } catch (error) {
      toast.error("Error al eliminar cita");
    }
  };

  const handleCreateService = async (appointment) => {
    try {
      await axios.post(`${API}/services`, {
        appointment_id: appointment.id,
        estimated_cost: 0
      }, getAuthHeaders());
      toast.success("Servicio creado. Ve a Producción para gestionar.");
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear servicio");
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      client_phone: "",
      client_email: "",
      vehicle_plate: "",
      vehicle_model: "",
      vehicle_year: "",
      service_type: "",
      description: "",
      scheduled_date: "",
      scheduled_time: ""
    });
    setDate(new Date());
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendiente: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
      confirmada: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      en_servicio: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      completada: "bg-green-500/20 text-green-400 border-green-500/30",
      cancelada: "bg-red-500/20 text-red-400 border-red-500/30"
    };
    const labels = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      en_servicio: "En Servicio",
      completada: "Completada",
      cancelada: "Cancelada"
    };
    return (
      <Badge variant="outline" className={cn("uppercase text-xs", styles[status] || styles.pendiente)}>
        {labels[status] || status}
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
    <div className="space-y-6 animate-fade-in" data-testid="appointments-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            Citas
          </h1>
          <p className="text-zinc-500 mt-1">Gestión de citas y agendamiento</p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="new-appointment-btn"
              className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                Agendar Nueva Cita
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              {/* Client Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Datos del Cliente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Nombre*</Label>
                    <Input
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      required
                      data-testid="appt-client-name"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Teléfono*</Label>
                    <Input
                      value={formData.client_phone}
                      onChange={(e) => setFormData({...formData, client_phone: e.target.value})}
                      required
                      data-testid="appt-client-phone"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Email (Opcional)</Label>
                    <Input
                      type="email"
                      value={formData.client_email}
                      onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                      data-testid="appt-client-email"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Datos del Vehículo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Placa*</Label>
                    <Input
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})}
                      required
                      data-testid="appt-vehicle-plate"
                      className="bg-zinc-950 border-zinc-800 text-white uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Modelo*</Label>
                    <Input
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                      required
                      placeholder="Ej: VENTO 150"
                      data-testid="appt-vehicle-model"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Año</Label>
                    <Input
                      type="number"
                      value={formData.vehicle_year}
                      onChange={(e) => setFormData({...formData, vehicle_year: e.target.value})}
                      placeholder="2024"
                      data-testid="appt-vehicle-year"
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Detalles del Servicio</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Tipo de Servicio*</Label>
                    <Select 
                      value={formData.service_type} 
                      onValueChange={(v) => setFormData({...formData, service_type: v})}
                    >
                      <SelectTrigger data-testid="appt-service-type" className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {serviceTypes.map(type => (
                          <SelectItem key={type} value={type} className="text-white hover:bg-zinc-800">
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-400 text-xs uppercase tracking-widest">Hora*</Label>
                    <Select 
                      value={formData.scheduled_time} 
                      onValueChange={(v) => setFormData({...formData, scheduled_time: v})}
                    >
                      <SelectTrigger data-testid="appt-time" className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        {timeSlots.map(time => (
                          <SelectItem key={time} value={time} className="text-white hover:bg-zinc-800">
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Fecha*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        data-testid="appt-date-btn"
                        className={cn(
                          "w-full justify-start text-left bg-zinc-950 border-zinc-800 text-white hover:bg-zinc-800",
                          !date && "text-zinc-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={es}
                        className="bg-zinc-900"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Descripción</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detalles adicionales del servicio..."
                    data-testid="appt-description"
                    className="bg-zinc-950 border-zinc-800 text-white min-h-[80px]"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                data-testid="appt-submit-btn"
                className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
              >
                Agendar Cita
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <CalendarIcon className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No hay citas registradas</p>
            <p className="text-zinc-600 text-sm mt-1">Crea una nueva cita para comenzar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appt) => (
            <Card key={appt.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all" data-testid={`appointment-${appt.id}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                        {appt.client_name}
                      </h3>
                      {getStatusBadge(appt.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Car className="w-4 h-4" />
                        {appt.vehicle_plate} - {appt.vehicle_model}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {appt.client_phone}
                      </span>
                      {appt.client_email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {appt.client_email}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      <span className="text-[#E31837] font-medium">{appt.service_type}</span>
                      <span className="text-zinc-500">
                        {appt.scheduled_date} • {appt.scheduled_time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {appt.status === "pendiente" && (
                      <Button
                        onClick={() => handleCreateService(appt)}
                        data-testid={`create-service-${appt.id}`}
                        className="bg-[#E31837] hover:bg-[#C4122C] text-white"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Crear Servicio
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(appt.id)}
                      data-testid={`delete-appt-${appt.id}`}
                      className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
