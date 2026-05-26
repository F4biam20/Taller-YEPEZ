import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import {
  Bike,
  Search,
  Car,
  CheckCircle,
  Clock,
  Wrench,
  User,
  LogIn,
  CalendarPlus,
  CalendarDays,
  ClipboardList,
  ShieldCheck,
  Phone,
  Mail,
  Hash,
  Settings,
  Pencil,
  Trash2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const statusSteps = [
  { key: "recibido", label: "Recibido", icon: Car, step: 1 },
  { key: "diagnostico", label: "Diagnóstico", icon: Search, step: 2 },
  { key: "en_reparacion", label: "En Reparación", icon: Wrench, step: 3 },
  { key: "listo", label: "Listo", icon: CheckCircle, step: 4 }
];

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

const today = new Date().toISOString().split("T")[0];
const heroImage = "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&q=80";

const inputClass = "bg-zinc-950/90 border-zinc-800 text-white h-11 focus-visible:ring-[#E31837]";
const labelClass = "text-zinc-400 text-[11px] uppercase tracking-widest";

export default function ClientPortal() {
  const { user, token, getAuthHeaders } = useAuth();
  const location = useLocation();
  const [plate, setPlate] = useState("");
  const [serviceData, setServiceData] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [clientAppointments, setClientAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [searched, setSearched] = useState(false);
  const initialPanel = new URLSearchParams(location.search).get("panel") === "citas" ? "appointment" : "tracking";
  const [activePanel, setActivePanel] = useState(initialPanel);
  const [appointmentData, setAppointmentData] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    vehicle_plate: "",
    vehicle_model: "",
    vehicle_year: "",
    service_type: "",
    description: "",
    scheduled_date: today,
    scheduled_time: ""
  });
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const getEmptyAppointmentData = () => ({
    client_name: user?.name || "",
    client_phone: user?.phone || "",
    client_email: user?.email || "",
    vehicle_plate: "",
    vehicle_model: "",
    vehicle_year: "",
    service_type: "",
    description: "",
    scheduled_date: today,
    scheduled_time: ""
  });

  useEffect(() => {
    const fetchClientServices = async () => {
      if (!user || user.role !== "cliente" || !token) return;

      setHistoryLoading(true);
      try {
        const response = await axios.get(`${API}/client/services`, getAuthHeaders());
        setServiceHistory(response.data.history || []);
        if (response.data.active_service) {
          setServiceData(response.data.active_service);
          setSearched(true);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error("Error al cargar tu historial");
        }
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchClientServices();
  }, [user, token]);

  const fetchClientAppointments = async () => {
    if (!user || user.role !== "cliente" || !token) return;

    setAppointmentsLoading(true);
    try {
      const response = await axios.get(`${API}/client/appointments`, getAuthHeaders());
      setClientAppointments(response.data || []);
    } catch (error) {
      toast.error("Error al cargar tus citas");
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "cliente" && token) {
      setAppointmentData((current) => ({
        ...current,
        client_name: current.client_name || user.name || "",
        client_phone: current.client_phone || user.phone || "",
        client_email: current.client_email || user.email || ""
      }));
      fetchClientAppointments();
    }
  }, [user, token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      toast.error("Ingresa una placa");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await axios.get(`${API}/track/${plate.trim().toUpperCase()}/history`);
      const history = response.data.history || [];
      setServiceHistory(history);
      setServiceData(response.data.active_service || history[0] || null);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const fallback = await axios.get(`${API}/track/${plate.trim().toUpperCase()}`);
          setServiceData(fallback.data);
          setServiceHistory([fallback.data]);
          return;
        } catch (fallbackError) {
          setServiceData(null);
          setServiceHistory([]);
          toast.error("No se encontró servicio para esta placa");
        }
      } else {
        setServiceData(null);
        setServiceHistory([]);
        toast.error("Error al buscar");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetAppointmentForm = () => {
    setAppointmentData(getEmptyAppointmentData());
    setEditingAppointmentId(null);
  };

  const canChangeAppointment = (appointment) => appointment.status !== "en_servicio";

  const handleEditAppointment = (appointment) => {
    if (!canChangeAppointment(appointment)) {
      toast.error("No puedes editar esta cita porque la moto ya está en proceso");
      return;
    }
    setAppointmentData({
      client_name: appointment.client_name || "",
      client_phone: appointment.client_phone || "",
      client_email: appointment.client_email || "",
      vehicle_plate: appointment.vehicle_plate || "",
      vehicle_model: appointment.vehicle_model || "",
      vehicle_year: appointment.vehicle_year || "",
      service_type: appointment.service_type || "",
      description: appointment.description || "",
      scheduled_date: appointment.scheduled_date || today,
      scheduled_time: appointment.scheduled_time || ""
    });
    setEditingAppointmentId(appointment.id);
    setActivePanel("appointment");
  };

  const handleDeleteAppointment = async (appointment) => {
    if (!canChangeAppointment(appointment)) {
      toast.error("No puedes eliminar esta cita porque la moto ya está en proceso");
      return;
    }
    if (!window.confirm("¿Eliminar esta cita?")) return;

    try {
      await axios.delete(`${API}/client/appointments/${appointment.id}`, getAuthHeaders());
      toast.success("Cita eliminada");
      if (editingAppointmentId === appointment.id) {
        resetAppointmentForm();
      }
      fetchClientAppointments();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar cita");
    }
  };

  const getAppointmentStatus = (status) => {
    const styles = {
      pendiente: "border-zinc-600 bg-zinc-800/40 text-zinc-300",
      confirmada: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      en_servicio: "border-orange-500/30 bg-orange-500/10 text-orange-400",
      completada: "border-green-500/30 bg-green-500/10 text-green-400",
      cancelada: "border-red-500/30 bg-red-500/10 text-red-400"
    };
    const labels = {
      pendiente: "Pendiente",
      confirmada: "Confirmada",
      en_servicio: "En proceso",
      completada: "Completada",
      cancelada: "Cancelada"
    };
    return {
      label: labels[status] || status,
      className: styles[status] || styles.pendiente
    };
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentData.service_type || !appointmentData.scheduled_time) {
      toast.error("Selecciona el servicio y la hora");
      return;
    }

    setAppointmentLoading(true);
    try {
      const payload = {
        ...appointmentData,
        vehicle_plate: appointmentData.vehicle_plate.trim().toUpperCase(),
        client_email: appointmentData.client_email || null,
        vehicle_year: appointmentData.vehicle_year ? parseInt(appointmentData.vehicle_year) : null
      };

      if (editingAppointmentId) {
        await axios.put(`${API}/client/appointments/${editingAppointmentId}`, payload, getAuthHeaders());
        toast.success("Cita actualizada");
      } else if (user?.role === "cliente" && token) {
        await axios.post(`${API}/client/appointments`, payload, getAuthHeaders());
        toast.success("Cita registrada. El administrador la verá como pendiente.");
      } else {
        await axios.post(`${API}/public/appointments`, payload);
        toast.success("Cita enviada. El administrador la verá como pendiente.");
      }
      resetAppointmentForm();
      fetchClientAppointments();
    } catch (error) {
      if (error.response?.status === 404) {
        toast.error("No se encontró la ruta para agendar. Reinicia el backend y vuelve a intentar.");
      } else {
        toast.error(error.response?.data?.detail || "Error al agendar cita");
      }
    } finally {
      setAppointmentLoading(false);
    }
  };

  const getCurrentStep = () => {
    if (!serviceData) return 0;
    return serviceData.current_step || 1;
  };

  const getStatusBadgeClass = (status) => {
    const styles = {
      recibido: "border-blue-500/30 bg-blue-500/10 text-blue-400",
      diagnostico: "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
      en_reparacion: "border-orange-500/30 bg-orange-500/10 text-orange-400",
      listo: "border-green-500/30 bg-green-500/10 text-green-400"
    };
    return styles[status] || "border-zinc-700 bg-zinc-800/40 text-zinc-400";
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white" data-testid="client-portal">
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 z-50">
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <Bike className="w-8 h-8 text-[#E31837]" />
            <span className="text-xl font-bold uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </span>
          </button>
          <Button
            onClick={handleLogin}
            data-testid="login-btn"
            className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Ingresar
          </Button>
        </div>
      </header>

      <section className="relative pt-24 pb-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/85 via-[#09090b]/95 to-[#09090b]" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 items-end">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 border border-[#E31837]/30 bg-[#E31837]/10 px-3 py-2 rounded-sm mb-5">
                <ShieldCheck className="w-4 h-4 text-[#E31837]" />
                <span className="text-xs uppercase tracking-widest text-zinc-300">Portal del cliente</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold uppercase leading-none" style={{ fontFamily: 'Barlow Condensed' }}>
                Transparencia para tu moto
              </h1>
              <p className="text-zinc-400 text-lg mt-5 max-w-xl">
                Consulta el avance de tu servicio o agenda una visita al taller con los datos que necesita el administrador.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 animate-fade-in">
              <div className="border border-zinc-800 bg-zinc-950/70 p-4 rounded-sm">
                <Search className="w-5 h-5 text-blue-400 mb-3" />
                <p className="text-sm font-semibold uppercase">Rastreo</p>
                <p className="text-xs text-zinc-500 mt-1">Consulta por placa</p>
              </div>
              <div className="border border-zinc-800 bg-zinc-950/70 p-4 rounded-sm">
                <CalendarDays className="w-5 h-5 text-orange-400 mb-3" />
                <p className="text-sm font-semibold uppercase">Citas</p>
                <p className="text-xs text-zinc-500 mt-1">Solicitud directa</p>
              </div>
              <div className="border border-zinc-800 bg-zinc-950/70 p-4 rounded-sm">
                <CheckCircle className="w-5 h-5 text-green-400 mb-3" />
                <p className="text-sm font-semibold uppercase">Estatus</p>
                <p className="text-xs text-zinc-500 mt-1">Avance actualizado</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setActivePanel("tracking")}
              className={cn(
                "border rounded-sm p-4 text-left transition-all",
                activePanel === "tracking"
                  ? "border-[#E31837] bg-[#E31837]/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-sm flex items-center justify-center",
                  activePanel === "tracking" ? "bg-[#E31837]/20" : "bg-blue-500/15"
                )}>
                  <Search className={cn("w-5 h-5", activePanel === "tracking" ? "text-[#E31837]" : "text-blue-400")} />
                </div>
                <div>
                  <p className="text-white font-bold uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                    Seguimiento de mi moto
                  </p>
                  <p className="text-zinc-500 text-sm">Servicio activo e historial por placa</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActivePanel("appointment")}
              className={cn(
                "border rounded-sm p-4 text-left transition-all",
                activePanel === "appointment"
                  ? "border-[#E31837] bg-[#E31837]/10"
                  : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-sm flex items-center justify-center",
                  activePanel === "appointment" ? "bg-[#E31837]/20" : "bg-orange-500/15"
                )}>
                  <CalendarPlus className={cn("w-5 h-5", activePanel === "appointment" ? "text-[#E31837]" : "text-orange-400")} />
                </div>
                <div>
                  <p className="text-white font-bold uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                    Crear una cita
                  </p>
                  <p className="text-zinc-500 text-sm">Solicita atención al taller</p>
                </div>
              </div>
            </button>
          </div>

          {activePanel === "tracking" && (
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-6 items-start">
            <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden animate-fade-in">
              <CardContent className="p-6 lg:p-7">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className={labelClass}>Seguimiento</p>
                    <h2 className="text-3xl font-bold uppercase mt-1" style={{ fontFamily: 'Barlow Condensed' }}>
                      Rastrea tu vehículo
                    </h2>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/15 rounded-sm flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-400" />
                  </div>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label className={labelClass}>Placa del vehículo</Label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        placeholder="Ej: ABC123"
                        data-testid="plate-search-input"
                        className="bg-zinc-950 border-zinc-800 text-white text-2xl uppercase tracking-wider h-14 font-bold text-center focus-visible:ring-[#E31837]"
                        style={{ fontFamily: 'Barlow Condensed' }}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        data-testid="search-btn"
                        className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider h-14 sm:w-16"
                      >
                        {loading ? (
                          <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                        ) : (
                          <Search className="w-6 h-6" />
                        )}
                      </Button>
                    </div>
                  </div>
                </form>

                {historyLoading && (
                  <div className="mt-6 border border-zinc-800 bg-zinc-950/50 p-5 rounded-sm flex items-center justify-center">
                    <span className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#E31837]" />
                  </div>
                )}

                {searched && !loading && serviceData && (
                  <div className="mt-6 border border-[#E31837]/40 bg-[#E31837]/5 p-4 rounded-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[#E31837] text-[11px] uppercase tracking-widest font-bold">
                          Servicio más actual
                        </p>
                        <h3 className="text-2xl font-bold text-white uppercase mt-1" style={{ fontFamily: 'Barlow Condensed' }}>
                          {serviceData.vehicle_plate}
                        </h3>
                        <p className="text-zinc-400 text-sm">{serviceData.vehicle_model}</p>
                      </div>
                      <span className={cn("inline-flex shrink-0 rounded-sm border px-2 py-1 text-[10px] font-bold uppercase tracking-widest", getStatusBadgeClass(serviceData.status))}>
                        {serviceData.status !== "listo" ? "Activo" : serviceData.status_label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-zinc-500 uppercase tracking-widest">
                        <span>Progreso</span>
                        <span className="text-zinc-300">{serviceData.progress}%</span>
                      </div>
                      <Progress value={serviceData.progress} className="h-2 bg-zinc-800" />
                    </div>

                    {serviceData.mechanic_notes && (
                      <p className="text-zinc-400 text-sm mt-4 leading-relaxed">
                        {serviceData.mechanic_notes}
                      </p>
                    )}
                  </div>
                )}

                {searched && !loading && serviceHistory.length > 0 && (
                  <div className="mt-5 border border-zinc-800 bg-zinc-950/40 rounded-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                      <div>
                        <p className={labelClass}>Historial de esta placa</p>
                        <p className="text-sm text-zinc-500 mt-1">
                          {serviceHistory.length} {serviceHistory.length === 1 ? "servicio encontrado" : "servicios encontrados"}
                        </p>
                      </div>
                      <Clock className="w-5 h-5 text-zinc-600" />
                    </div>

                    <div className="divide-y divide-zinc-800">
                      {serviceHistory.map((service, index) => {
                        const isLatest = index === 0;
                        const isActive = service.status !== "listo";

                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => setServiceData(service)}
                            className={cn(
                              "w-full p-4 text-left hover:bg-zinc-900/80 transition-colors",
                              serviceData?.id === service.id && "bg-zinc-900"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-white font-semibold uppercase">{service.vehicle_model}</p>
                                  {isLatest && (
                                    <span className="bg-[#E31837]/15 text-[#E31837] border border-[#E31837]/30 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-widest">
                                      Más actual
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-500 text-xs mt-1">
                                  {service.updated_at ? new Date(service.updated_at).toLocaleString("es-MX") : "Sin actualización"}
                                </p>
                              </div>
                              <span className={cn("inline-flex shrink-0 rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", getStatusBadgeClass(service.status))}>
                                {isActive ? "Activo" : service.status_label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {searched && !loading && !serviceData && (
                  <div className="mt-6 border border-zinc-800 bg-zinc-950/50 p-5 rounded-sm text-center">
                    <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-white font-bold uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                      No se encontró historial
                    </p>
                    <p className="text-zinc-500 text-sm mt-1">Revisa que la placa esté escrita correctamente.</p>
                  </div>
                )}

                <div className="mt-6 border-t border-zinc-800 pt-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <ClipboardList className="w-4 h-4 text-[#E31837]" />
                    Solo necesitas la placa registrada en recepción.
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Clock className="w-4 h-4 text-[#E31837]" />
                    Los cambios aparecen cuando el taller actualiza el servicio.
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="animate-fade-in">
              {serviceData ? (
                <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden h-full">
                  <div className="px-6 lg:px-8 py-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className={labelClass}>
                        {serviceData.status !== "listo" ? "Servicio activo" : "Último servicio"}
                      </p>
                      <h3 className="text-2xl font-bold uppercase mt-1" style={{ fontFamily: 'Barlow Condensed' }}>
                        {serviceData.vehicle_plate} - {serviceData.vehicle_model}
                      </h3>
                    </div>
                    <span className={cn("inline-flex w-fit items-center rounded-sm border px-3 py-1 text-xs font-bold uppercase tracking-widest", getStatusBadgeClass(serviceData.status))}>
                      {serviceData.status_label}
                    </span>
                  </div>

                  <div className="p-6 lg:p-8 border-b border-zinc-800">
                    <div className="flex items-center justify-between relative overflow-x-auto pb-8">
                      <div className="absolute top-6 left-0 right-0 h-1 bg-zinc-800" />
                      <div
                        className="absolute top-6 left-0 h-1 bg-[#E31837] transition-all duration-500"
                        style={{ width: `${((getCurrentStep() - 1) / 3) * 100}%` }}
                      />

                      {statusSteps.map((step) => {
                        const isCompleted = getCurrentStep() >= step.step;
                        const isCurrent = getCurrentStep() === step.step;

                        return (
                          <div key={step.key} className="min-w-20 flex flex-col items-center relative z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-sm flex items-center justify-center transition-all",
                              isCompleted ? "bg-[#E31837] text-white" : "bg-zinc-800 text-zinc-500"
                            )}>
                              <step.icon className="w-6 h-6" />
                            </div>
                            <p className={cn(
                              "mt-2 text-xs uppercase tracking-wider font-bold",
                              isCurrent ? "text-[#E31837]" : isCompleted ? "text-white" : "text-zinc-600"
                            )}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <CardContent className="p-6 lg:p-8">
                    <div className="grid xl:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center">
                            <Car className="w-8 h-8 text-[#E31837]" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                              {serviceData.vehicle_plate}
                            </h2>
                            <p className="text-zinc-400">{serviceData.vehicle_model}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Cliente</p>
                            <p className="text-white font-medium">{serviceData.client_name}</p>
                          </div>
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Estado</p>
                            <p className="text-[#E31837] font-bold uppercase">{serviceData.status_label}</p>
                          </div>
                        </div>

                        {serviceData.mechanic_name && (
                          <div className="p-4 bg-zinc-800/30 rounded-sm flex items-center gap-3">
                            <User className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs uppercase tracking-widest">Mecánico Asignado</p>
                              <p className="text-white font-medium">{serviceData.mechanic_name}</p>
                            </div>
                          </div>
                        )}

                        {serviceData.mechanic_notes && (
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Nota del mecánico</p>
                            <p className="text-white leading-relaxed">{serviceData.mechanic_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-zinc-800/20 rounded-sm border border-zinc-800 flex flex-col items-center justify-center min-h-64">
                        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Progreso del Servicio</p>
                        <p className="text-6xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }} data-testid="service-progress">
                          {serviceData.progress}%
                        </p>
                        <Progress value={serviceData.progress} className="h-3 bg-zinc-700 w-full mt-6" />

                        {serviceData.estimated_cost > 0 && (
                          <div className="mt-6 pt-6 border-t border-zinc-800 w-full text-center">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Costo Estimado</p>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                              ${serviceData.estimated_cost.toLocaleString()} MXN
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                      <p className="text-zinc-600 text-sm">
                        Última actualización: {serviceData.updated_at ? new Date(serviceData.updated_at).toLocaleString('es-MX') : "Sin actualización"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-900/70 border-zinc-800 h-full">
                  <CardContent className="h-full min-h-96 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-zinc-800/60 rounded-sm flex items-center justify-center mb-5">
                      <ClipboardList className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                      Procedimiento de la moto
                    </h3>
                    <p className="text-zinc-500 mt-2 max-w-sm">
                      Busca una placa para ver aquí el servicio más actual, su progreso y el estado del taller.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
          )}

          {activePanel === "appointment" && (
          <div className="max-w-5xl mx-auto">
            <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden animate-fade-in">
              <CardContent className="p-6 lg:p-7">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className={labelClass}>{editingAppointmentId ? "Editando cita" : "Nueva solicitud"}</p>
                    <h2 className="text-3xl font-bold uppercase mt-1" style={{ fontFamily: 'Barlow Condensed' }}>
                      {editingAppointmentId ? "Actualiza tu cita" : "Agenda tu cita"}
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                      {editingAppointmentId
                        ? "Puedes cambiarla mientras la moto no esté en proceso."
                        : "El administrador verá tu solicitud como pendiente."}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[#E31837]/20 rounded-sm flex items-center justify-center">
                    <CalendarPlus className="w-6 h-6 text-[#E31837]" />
                  </div>
                </div>

                <div className="mb-6 border border-zinc-800 bg-zinc-950/50 rounded-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-3">
                    <div>
                      <p className={labelClass}>Mis citas</p>
                      <p className="text-sm text-zinc-500 mt-1">Registra, consulta, edita o elimina tus citas pendientes.</p>
                    </div>
                    <CalendarDays className="w-5 h-5 text-zinc-600" />
                  </div>

                  {user?.role !== "cliente" || !token ? (
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-sm text-zinc-500">
                        Inicia sesión como cliente para ver tus citas y poder editarlas o eliminarlas.
                      </p>
                      <Button
                        type="button"
                        onClick={handleLogin}
                        className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Ingresar
                      </Button>
                    </div>
                  ) : appointmentsLoading ? (
                    <div className="p-5 flex justify-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-[#E31837]" />
                    </div>
                  ) : clientAppointments.length === 0 ? (
                    <p className="p-4 text-sm text-zinc-500">Todavía no tienes citas registradas.</p>
                  ) : (
                    <div className="divide-y divide-zinc-800">
                      {clientAppointments.map((appointment) => {
                        const statusMeta = getAppointmentStatus(appointment.status);
                        const canChange = canChangeAppointment(appointment);

                        return (
                          <div key={appointment.id} className="p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-white font-semibold uppercase">{appointment.vehicle_plate} - {appointment.vehicle_model}</p>
                                <span className={cn("inline-flex rounded-sm border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest", statusMeta.className)}>
                                  {statusMeta.label}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-500 mt-1">
                                {appointment.scheduled_date} • {appointment.scheduled_time} • {appointment.service_type}
                              </p>
                              {!canChange && (
                                <p className="text-xs text-orange-400 mt-2">La moto ya está en proceso; esta cita solo se puede consultar.</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={!canChange}
                                onClick={() => handleEditAppointment(appointment)}
                                className="text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-40"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={!canChange}
                                onClick={() => handleDeleteAppointment(appointment)}
                                className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form onSubmit={handleAppointmentSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={labelClass}>Nombre*</Label>
                      <Input
                        value={appointmentData.client_name}
                        onChange={(e) => setAppointmentData({ ...appointmentData, client_name: e.target.value })}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Teléfono*</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                          value={appointmentData.client_phone}
                          onChange={(e) => setAppointmentData({ ...appointmentData, client_phone: e.target.value })}
                          required
                          className={cn(inputClass, "pl-9")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                          type="email"
                          value={appointmentData.client_email}
                          onChange={(e) => setAppointmentData({ ...appointmentData, client_email: e.target.value })}
                          className={cn(inputClass, "pl-9")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Placa*</Label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                          value={appointmentData.vehicle_plate}
                          onChange={(e) => setAppointmentData({ ...appointmentData, vehicle_plate: e.target.value.toUpperCase() })}
                          required
                          className={cn(inputClass, "pl-9 uppercase")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Modelo*</Label>
                      <div className="relative">
                        <Bike className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                        <Input
                          value={appointmentData.vehicle_model}
                          onChange={(e) => setAppointmentData({ ...appointmentData, vehicle_model: e.target.value })}
                          required
                          placeholder="Ej: VENTO 150"
                          className={cn(inputClass, "pl-9")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Año</Label>
                      <Input
                        type="number"
                        value={appointmentData.vehicle_year}
                        onChange={(e) => setAppointmentData({ ...appointmentData, vehicle_year: e.target.value })}
                        placeholder="2024"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className={labelClass}>Servicio*</Label>
                      <Select
                        value={appointmentData.service_type}
                        onValueChange={(value) => setAppointmentData({ ...appointmentData, service_type: value })}
                      >
                        <SelectTrigger className={inputClass}>
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                          {serviceTypes.map((type) => (
                            <SelectItem key={type} value={type} className="text-white hover:bg-zinc-800">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className={labelClass}>Fecha*</Label>
                        <Input
                          type="date"
                          min={today}
                          value={appointmentData.scheduled_date}
                          onChange={(e) => setAppointmentData({ ...appointmentData, scheduled_date: e.target.value })}
                          required
                          className={cn(inputClass, "[color-scheme:dark]")}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className={labelClass}>Hora*</Label>
                        <Select
                          value={appointmentData.scheduled_time}
                          onValueChange={(value) => setAppointmentData({ ...appointmentData, scheduled_time: value })}
                        >
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Hora" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time} className="text-white hover:bg-zinc-800">
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className={labelClass}>Motivo de la cita*</Label>
                    <div className="relative">
                      <Settings className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                      <Textarea
                        value={appointmentData.description}
                        onChange={(e) => setAppointmentData({ ...appointmentData, description: e.target.value })}
                        required
                        placeholder="Ej: hace ruido al frenar, no enciende, requiere servicio..."
                        className="bg-zinc-950/90 border-zinc-800 text-white min-h-[96px] pl-9 focus-visible:ring-[#E31837]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {editingAppointmentId && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetAppointmentForm}
                        className="sm:w-44 border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={appointmentLoading}
                      className="flex-1 bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider h-12"
                    >
                      {appointmentLoading ? "Enviando..." : editingAppointmentId ? "Guardar cambios" : "Solicitar Cita"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
          )}

          {false && activePanel === "tracking" && searched && !loading && (
            <div className="animate-fade-in mt-6">
              {serviceData ? (
                <Card className="bg-zinc-900/70 border-zinc-800 overflow-hidden">
                  <div className="px-6 lg:px-8 py-5 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className={labelClass}>
                        {serviceData.status !== "listo" ? "Servicio activo" : "Último servicio"}
                      </p>
                      <h3 className="text-2xl font-bold uppercase mt-1" style={{ fontFamily: 'Barlow Condensed' }}>
                        {serviceData.vehicle_plate} - {serviceData.vehicle_model}
                      </h3>
                    </div>
                    <span className={cn("inline-flex w-fit items-center rounded-sm border px-3 py-1 text-xs font-bold uppercase tracking-widest", getStatusBadgeClass(serviceData.status))}>
                      {serviceData.status_label}
                    </span>
                  </div>
                  <div className="p-6 lg:p-8 border-b border-zinc-800">
                    <div className="flex items-center justify-between relative overflow-x-auto pb-8">
                      <div className="absolute top-6 left-0 right-0 h-1 bg-zinc-800" />
                      <div
                        className="absolute top-6 left-0 h-1 bg-[#E31837] transition-all duration-500"
                        style={{ width: `${((getCurrentStep() - 1) / 3) * 100}%` }}
                      />

                      {statusSteps.map((step) => {
                        const isCompleted = getCurrentStep() >= step.step;
                        const isCurrent = getCurrentStep() === step.step;

                        return (
                          <div key={step.key} className="min-w-20 flex flex-col items-center relative z-10">
                            <div className={cn(
                              "w-12 h-12 rounded-sm flex items-center justify-center transition-all",
                              isCompleted
                                ? "bg-[#E31837] text-white"
                                : "bg-zinc-800 text-zinc-500"
                            )}>
                              <step.icon className="w-6 h-6" />
                            </div>
                            <p className={cn(
                              "mt-2 text-xs uppercase tracking-wider font-bold",
                              isCurrent ? "text-[#E31837]" : isCompleted ? "text-white" : "text-zinc-600"
                            )}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <CardContent className="p-6 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center">
                            <Car className="w-8 h-8 text-[#E31837]" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                              {serviceData.vehicle_plate}
                            </h2>
                            <p className="text-zinc-400">{serviceData.vehicle_model}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Cliente</p>
                            <p className="text-white font-medium">{serviceData.client_name}</p>
                          </div>
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Estado</p>
                            <p className="text-[#E31837] font-bold uppercase">{serviceData.status_label}</p>
                          </div>
                        </div>

                        {serviceData.mechanic_name && (
                          <div className="p-4 bg-zinc-800/30 rounded-sm flex items-center gap-3">
                            <User className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs uppercase tracking-widest">Mecánico Asignado</p>
                              <p className="text-white font-medium">{serviceData.mechanic_name}</p>
                            </div>
                          </div>
                        )}

                        {serviceData.mechanic_notes && (
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Nota del mecánico</p>
                            <p className="text-white leading-relaxed">{serviceData.mechanic_notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="p-6 bg-zinc-800/20 rounded-sm border border-zinc-800 flex flex-col items-center justify-center">
                        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">Progreso del Servicio</p>
                        <div className="text-center">
                          <p className="text-6xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }} data-testid="service-progress">
                            {serviceData.progress}%
                          </p>
                        </div>
                        <Progress value={serviceData.progress} className="h-3 bg-zinc-700 w-full mt-6" />

                        {serviceData.estimated_cost > 0 && (
                          <div className="mt-6 pt-6 border-t border-zinc-800 w-full text-center">
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Costo Estimado</p>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                              ${serviceData.estimated_cost.toLocaleString()} MXN
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                      <p className="text-zinc-600 text-sm">
                        Última actualización: {new Date(serviceData.updated_at).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-zinc-900/70 border-zinc-800">
                  <CardContent className="p-12 text-center">
                    <Search className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                      No se encontró servicio
                    </h3>
                    <p className="text-zinc-500">
                      No hay un servicio activo para la placa <span className="text-white font-bold">{plate}</span>
                    </p>
                    <p className="text-zinc-600 text-sm mt-2">
                      Verifica que la placa sea correcta o contacta al taller
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </div>
      </main>

      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 opacity-50">
            <Bike className="w-6 h-6 text-zinc-500" />
            <span className="text-sm text-zinc-500">
              YEPEZ CONTROLS © 2026 - Centro de Servicio Autorizado VENTO
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            Proyecto de Titulación UJAT - Ingeniería en Sistemas
          </p>
        </div>
      </footer>
    </div>
  );
}
