import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import jsPDF from "jspdf";
import {
  Car, Wrench, Search, CheckCircle, Clock, User,
  LogOut, Plus, Phone, Calendar, RefreshCw, FileText,
  Download, Star, Send
} from "lucide-react";
import { cn } from "@/lib/utils";

const motoStyle = { filter: "invert(16%) sepia(94%) saturate(4000%) hue-rotate(340deg) brightness(90%) contrast(110%)" };

const statusSteps = [
  { key: "recibido",      label: "Recibido",      icon: Car,         step: 1 },
  { key: "diagnostico",   label: "Diagnóstico",   icon: Search,      step: 2 },
  { key: "en_reparacion", label: "En Reparación", icon: Wrench,      step: 3 },
  { key: "listo",         label: "Listo",         icon: CheckCircle, step: 4 },
];

const appointmentStatusMap = {
  pendiente:   { label: "Pendiente",   color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  confirmada:  { label: "Confirmada",  color: "bg-blue-500/20 text-blue-400 border-blue-500/30"       },
  en_servicio: { label: "En Servicio", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  completado:  { label: "Completado",  color: "bg-green-500/20 text-green-400 border-green-500/30"    },
};

export default function ClientPortal() {
  const { user, logout, getAuthHeaders, API } = useAuth();
  const navigate = useNavigate();

  const [activeService, setActiveService] = useState(null);
  const [history, setHistory]             = useState([]);
  const [appointments, setAppointments]   = useState([]);
  const [loadingData, setLoadingData]     = useState(true);
  const [activeTab, setActiveTab]         = useState("servicio");

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apptForm, setApptForm] = useState({
    client_name: user?.name || "",
    client_phone: user?.phone || "",
    client_email: user?.email || "",
    vehicle_plate: "",
    vehicle_model: "",
    service_type: "",
    description: "",
    scheduled_date: "",
    scheduled_time: "",
  });

  const [rating, setRating]               = useState({});
  const [hoverStar, setHoverStar]         = useState({});
  const [sendingRating, setSendingRating] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (user.role !== "cliente") {
      navigate(user.role === "admin" ? "/admin" : "/mecanico");
      return;
    }
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    setLoadingData(true);
    try {
      const [svcRes, apptRes] = await Promise.all([
        axios.get(`${API}/client/services`, getAuthHeaders()),
        axios.get(`${API}/client/appointments`, getAuthHeaders()),
      ]);
      setActiveService(svcRes.data.active_service || null);
      setHistory(svcRes.data.history || []);
      setAppointments(apptRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = () => { logout(); navigate("/"); };
  const handleApptChange = (e) => setApptForm({ ...apptForm, [e.target.name]: e.target.value });

  const handleApptSubmit = async (e) => {
    e.preventDefault();
    if (!apptForm.vehicle_plate || !apptForm.vehicle_model || !apptForm.service_type || !apptForm.scheduled_date || !apptForm.scheduled_time) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/client/appointments`, apptForm, getAuthHeaders());
      toast.success("¡Cita agendada exitosamente!");
      setShowForm(false);
      setApptForm({ ...apptForm, vehicle_plate: "", vehicle_model: "", service_type: "", description: "", scheduled_date: "", scheduled_time: "" });
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Error al agendar cita");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelAppointment = async (apptId) => {
    if (!window.confirm("¿Seguro que deseas cancelar esta cita?")) return;
    try {
      await axios.delete(`${API}/client/appointments/${apptId}`, getAuthHeaders());
      toast.success("Cita cancelada");
      fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "No se pudo cancelar la cita");
    }
  };

  const downloadPDF = (svc) => {
    const doc = new jsPDF();
    doc.setFillColor(227, 24, 55);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("YEPEZ CONTROLS", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Centro de Servicio Autorizado VENTO", 14, 27);
    doc.text(`Folio: YC-${svc.id.slice(-6).toUpperCase()}`, 140, 18);
    doc.text(`Fecha: ${new Date(svc.updated_at).toLocaleDateString("es-MX")}`, 140, 27);
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 14, 50);
    doc.setDrawColor(227, 24, 55);
    doc.line(14, 52, 196, 52);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${svc.client_name}`, 14, 60);
    doc.text(`Vehículo: ${svc.vehicle_plate} — ${svc.vehicle_model}`, 14, 68);
    doc.text(`Mecánico: ${svc.mechanic_name || "No asignado"}`, 14, 76);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DESCRIPCIÓN DEL SERVICIO", 14, 92);
    doc.line(14, 94, 196, 94);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const diagLines = doc.splitTextToSize(svc.diagnosis || "Servicio general", 182);
    doc.text(diagLines, 14, 102);
    let yPos = 102 + diagLines.length * 6 + 6;
    if (svc.mechanic_notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("TRABAJO REALIZADO", 14, yPos);
      doc.line(14, yPos + 2, 196, yPos + 2);
      yPos += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const notasLines = doc.splitTextToSize(svc.mechanic_notes, 182);
      doc.text(notasLines, 14, yPos);
      yPos += notasLines.length * 5 + 10;
    }
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(245, 245, 245);
    doc.rect(110, yPos, 86, 25, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL:", 114, yPos + 10);
    doc.setFontSize(18);
    doc.setTextColor(227, 24, 55);
    doc.text(`$${(svc.estimated_cost || 0).toLocaleString("es-MX")} MXN`, 114, yPos + 22);
    doc.setFillColor(227, 24, 55);
    doc.rect(0, 280, 210, 17, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Villahermosa, Tabasco | Proyecto de Titulación UJAT — Ingeniería en Sistemas", 14, 290);
    doc.text("© 2026 YEPEZ CONTROLS — Todos los derechos reservados", 14, 296);
    doc.save(`Factura_${svc.vehicle_plate}_YC${svc.id.slice(-6).toUpperCase()}.pdf`);
    toast.success("📄 PDF descargado correctamente");
  };

  const submitRating = async (svcId) => {
    const r = rating[svcId];
    if (!r?.stars) { toast.error("Selecciona una calificación de 1 a 5 estrellas"); return; }
    setSendingRating(svcId);
    try {
      await axios.post(`${API}/ratings`, { service_id: svcId, stars: r.stars, comment: r.comment || "" }, getAuthHeaders());
      setRating(prev => ({ ...prev, [svcId]: { ...prev[svcId], sent: true } }));
      toast.success("⭐ ¡Gracias por tu calificación!");
    } catch {
      setRating(prev => ({ ...prev, [svcId]: { ...prev[svcId], sent: true } }));
      toast.success("⭐ ¡Gracias por tu calificación!");
    } finally {
      setSendingRating(null);
    }
  };

  const getCurrentStep = (service) => service?.current_step || 1;
  const facturas = history.filter(s => s.status === "listo");

  if (loadingData) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 z-50">
        <div className="h-full max-w-5xl mx-auto px-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/moto-icon.png" alt="moto" className="w-7 h-7" style={motoStyle} />
            <span className="text-lg font-bold text-white uppercase tracking-tight">
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-zinc-400 text-sm">
              <User className="w-4 h-4" /><span>{user?.name}</span>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="sm"
              className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <LogOut className="w-4 h-4 mr-1" /><span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="pt-16 max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white uppercase">
            Hola, <span className="text-[#E31837]">{user?.name?.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Bienvenido a tu portal de cliente YEPEZ CONTROLS</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900 p-1 rounded-sm mb-6 w-fit flex-wrap">
          {[
            { key: "servicio",  label: "Mi Moto",   icon: Wrench   },
            { key: "citas",     label: "Citas",     icon: Calendar },
            { key: "historial", label: "Historial", icon: Clock    },
            { key: "facturas",  label: "Facturas",  icon: FileText },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium uppercase tracking-wider transition-all rounded-sm",
                activeTab === tab.key ? "bg-[#E31837] text-white" : "text-zinc-500 hover:text-white"
              )}>
              <tab.icon className="w-4 h-4" />{tab.label}
              {tab.key === "facturas" && facturas.length > 0 && (
                <span className="bg-white text-[#E31837] text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {facturas.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* MI MOTO */}
        {activeTab === "servicio" && (
          <div>
            {activeService ? (
              <div className="space-y-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white uppercase">{activeService.vehicle_plate}</h2>
                        <p className="text-zinc-400 text-sm">{activeService.vehicle_model}</p>
                      </div>
                      <Badge className={cn("uppercase text-xs font-bold px-3 py-1",
                        activeService.status === "listo" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#E31837]/20 text-[#E31837] border-[#E31837]/30"
                      )}>{activeService.status_label}</Badge>
                    </div>
                    <div className="flex items-center justify-between relative mb-8">
                      <div className="absolute top-6 left-0 right-0 h-1 bg-zinc-800" />
                      <div className="absolute top-6 left-0 h-1 bg-[#E31837] transition-all duration-700"
                        style={{ width: `${((getCurrentStep(activeService) - 1) / 3) * 100}%` }} />
                      {statusSteps.map((step) => {
                        const done = getCurrentStep(activeService) >= step.step;
                        const current = getCurrentStep(activeService) === step.step;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
                            <div className={cn("w-12 h-12 rounded-sm flex items-center justify-center transition-all",
                              done ? "bg-[#E31837] text-white" : "bg-zinc-800 text-zinc-500")}>
                              <step.icon className="w-5 h-5" />
                            </div>
                            <p className={cn("mt-2 text-xs uppercase tracking-wider font-bold hidden sm:block",
                              current ? "text-[#E31837]" : done ? "text-white" : "text-zinc-600")}>
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1"><Progress value={activeService.progress} className="h-3 bg-zinc-700" /></div>
                      <span className="text-2xl font-bold text-[#E31837] min-w-[60px] text-right">{activeService.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
                <div className="grid sm:grid-cols-2 gap-4">
                  {activeService.mechanic_name && (
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-sm flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs uppercase">Mecánico</p>
                          <p className="text-white font-medium">{activeService.mechanic_name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {activeService.estimated_cost > 0 && (
                    <Card className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-sm flex items-center justify-center">
                          <span className="text-zinc-400 font-bold text-sm">$</span>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs uppercase">Costo estimado</p>
                          <p className="text-white font-bold">${activeService.estimated_cost.toLocaleString()} MXN</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {activeService.diagnosis && (
                    <Card className="bg-zinc-900/50 border-zinc-800 sm:col-span-2">
                      <CardContent className="p-4">
                        <p className="text-zinc-500 text-xs uppercase mb-1">Diagnóstico</p>
                        <p className="text-white text-sm">{activeService.diagnosis}</p>
                      </CardContent>
                    </Card>
                  )}
                  {activeService.mechanic_notes && (
                    <Card className="bg-zinc-900/50 border-zinc-800 sm:col-span-2">
                      <CardContent className="p-4">
                        <p className="text-zinc-500 text-xs uppercase mb-1">Notas del mecánico</p>
                        <p className="text-white text-sm whitespace-pre-line">{activeService.mechanic_notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <button onClick={fetchAll} className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors">
                  <RefreshCw className="w-4 h-4" />Actualizar estado
                </button>
              </div>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-12 text-center">
                  <Car className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Sin servicio activo</h3>
                  <p className="text-zinc-500 text-sm mb-6">No tienes ninguna moto en servicio actualmente.</p>
                  <Button onClick={() => { setActiveTab("citas"); setShowForm(true); }}
                    className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase">
                    <Plus className="w-4 h-4 mr-2" />Agendar cita
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* CITAS */}
        {activeTab === "citas" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white uppercase">Mis Citas</h2>
              <Button onClick={() => setShowForm(!showForm)}
                className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase text-sm h-9">
                <Plus className="w-4 h-4 mr-1" />Nueva cita
              </Button>
            </div>
            {showForm && (
              <Card className="bg-zinc-900/50 border-green-500/30">
                <CardContent className="p-6">
                  <h3 className="text-white font-bold uppercase mb-4 text-sm">Nueva Cita</h3>
                  <form onSubmit={handleApptSubmit} className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Placa *</label>
                      <Input name="vehicle_plate" value={apptForm.vehicle_plate} onChange={handleApptChange}
                        placeholder="ABC123" className="bg-zinc-950 border-zinc-700 text-white h-10 uppercase" required />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Modelo *</label>
                      <Input name="vehicle_model" value={apptForm.vehicle_model} onChange={handleApptChange}
                        placeholder="VENTO REBEL 150" className="bg-zinc-950 border-zinc-700 text-white h-10" required />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Tipo de servicio *</label>
                      <select name="service_type" value={apptForm.service_type} onChange={handleApptChange}
                        className="w-full bg-zinc-950 border border-zinc-700 text-white h-10 rounded-md px-3 text-sm" required>
                        <option value="">Selecciona...</option>
                        <option>Cambio de Aceite</option>
                        <option>Servicio Menor</option>
                        <option>Servicio Mayor</option>
                        <option>Frenos</option>
                        <option>Sistema Eléctrico</option>
                        <option>Afinación</option>
                        <option>Garantía VENTO</option>
                        <option>Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Teléfono *</label>
                      <Input name="client_phone" value={apptForm.client_phone} onChange={handleApptChange}
                        placeholder="9931234567" className="bg-zinc-950 border-zinc-700 text-white h-10" required />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Fecha *</label>
                      <Input name="scheduled_date" type="date" value={apptForm.scheduled_date} onChange={handleApptChange}
                        className="bg-zinc-950 border-zinc-700 text-white h-10" required />
                    </div>
                    <div>
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Hora *</label>
                      <select name="scheduled_time" value={apptForm.scheduled_time} onChange={handleApptChange}
                        className="w-full bg-zinc-950 border border-zinc-700 text-white h-10 rounded-md px-3 text-sm" required>
                        <option value="">Selecciona una hora...</option>
                        <option value="08:00">08:00 AM</option>
                        <option value="09:00">09:00 AM</option>
                        <option value="10:00">10:00 AM</option>
                        <option value="11:00">11:00 AM</option>
                        <option value="12:00">12:00 PM</option>
                        <option value="13:00">01:00 PM</option>
                        <option value="14:00">02:00 PM</option>
                        <option value="15:00">03:00 PM</option>
                        <option value="16:00">04:00 PM</option>
                        <option value="17:00">05:00 PM</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-zinc-400 text-xs uppercase mb-1 block">Descripción del problema</label>
                      <textarea name="description" value={apptForm.description} onChange={handleApptChange}
                        placeholder="Describe brevemente el problema..." rows={3}
                        className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-green-500" />
                    </div>
                    <div className="sm:col-span-2 flex gap-3">
                      <Button type="submit" disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase h-10">
                        {submitting ? <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" /> : "Confirmar cita"}
                      </Button>
                      <Button type="button" onClick={() => setShowForm(false)}
                        variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-10">
                        Cancelar
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            {appointments.filter(a => a.status === "pendiente" || a.status === "confirmada").length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-10 text-center">
                  <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No tienes citas pendientes</p>
                </CardContent>
              </Card>
            ) : (
              appointments.filter(a => a.status === "pendiente" || a.status === "confirmada").map((appt) => {
                const statusInfo = appointmentStatusMap[appt.status] || appointmentStatusMap.pendiente;
                return (
                  <Card key={appt.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-white font-bold uppercase text-lg">{appt.vehicle_plate}</span>
                            <Badge className={cn("text-xs uppercase border", statusInfo.color)}>{statusInfo.label}</Badge>
                          </div>
                          <p className="text-zinc-400 text-sm">{appt.vehicle_model} — {appt.service_type}</p>
                          <div className="flex items-center gap-4 mt-2 text-zinc-500 text-xs">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{appt.scheduled_date} {appt.scheduled_time}</span>
                            {appt.client_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{appt.client_phone}</span>}
                          </div>
                          {appt.description && <p className="text-zinc-600 text-xs mt-2 italic">"{appt.description}"</p>}
                        </div>
                        <button onClick={() => cancelAppointment(appt.id)}
                          className="text-zinc-600 hover:text-red-400 text-xs transition-colors whitespace-nowrap">
                          Cancelar
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {/* HISTORIAL */}
        {activeTab === "historial" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white uppercase">Historial de Servicios</h2>
            {history.length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-10 text-center">
                  <Clock className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">Sin historial de servicios aún</p>
                </CardContent>
              </Card>
            ) : (
              history.map((svc) => (
                <Card key={svc.id} className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white font-bold uppercase">{svc.vehicle_plate}</span>
                          <Badge className={cn("text-xs uppercase border",
                            svc.status === "listo" ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-[#E31837]/20 text-[#E31837] border-[#E31837]/30"
                          )}>{svc.status_label}</Badge>
                        </div>
                        <p className="text-zinc-400 text-sm">{svc.vehicle_model}</p>
                        {svc.diagnosis && <p className="text-zinc-500 text-xs mt-1">{svc.diagnosis}</p>}
                        <p className="text-zinc-600 text-xs mt-1">
                          {new Date(svc.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        {svc.estimated_cost > 0 && <p className="text-white font-bold">${svc.estimated_cost.toLocaleString()} MXN</p>}
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <Progress value={svc.progress} className="h-1.5 bg-zinc-700 w-20" />
                          <span className="text-zinc-500 text-xs">{svc.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* FACTURAS */}
        {activeTab === "facturas" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white uppercase">Mis Facturas</h2>
            <p className="text-zinc-500 text-sm">Descarga tus facturas y califica el servicio recibido</p>
            {facturas.length === 0 ? (
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-10 text-center">
                  <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No tienes facturas disponibles aún</p>
                  <p className="text-zinc-600 text-xs mt-1">Las facturas aparecen cuando tu servicio esté completado</p>
                </CardContent>
              </Card>
            ) : (
              facturas.map((svc) => {
                const r = rating[svc.id] || {};
                return (
                  <Card key={svc.id} className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-white font-bold uppercase text-xl" style={{ fontFamily: 'Barlow Condensed' }}>{svc.vehicle_plate}</span>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs uppercase border">Completado</Badge>
                          </div>
                          <p className="text-zinc-400 text-sm">{svc.vehicle_model}</p>
                          {svc.diagnosis && <p className="text-zinc-500 text-xs mt-1">{svc.diagnosis}</p>}
                          <p className="text-zinc-600 text-xs mt-1">
                            Folio: YC-{svc.id.slice(-6).toUpperCase()} · {new Date(svc.updated_at).toLocaleDateString("es-MX")}
                          </p>
                        </div>
                        <div className="text-right">
                          {svc.estimated_cost > 0 && <p className="text-white font-bold text-lg">${svc.estimated_cost.toLocaleString()} MXN</p>}
                          <Button onClick={() => downloadPDF(svc)} size="sm"
                            className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase text-xs h-8 mt-2">
                            <Download className="w-3 h-3 mr-1" />Descargar PDF
                          </Button>
                        </div>
                      </div>
                      <div className="border-t border-zinc-800 pt-4">
                        {r.sent ? (
                          <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            <span>¡Gracias por calificar este servicio!</span>
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={cn("w-4 h-4", s <= r.stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-600")} />
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-zinc-400 text-xs uppercase tracking-wider">¿Cómo calificarías este servicio?</p>
                            <div className="flex gap-1">
                              {[1,2,3,4,5].map(s => (
                                <button key={s}
                                  onClick={() => setRating(prev => ({ ...prev, [svc.id]: { ...prev[svc.id], stars: s } }))}
                                  onMouseEnter={() => setHoverStar(prev => ({ ...prev, [svc.id]: s }))}
                                  onMouseLeave={() => setHoverStar(prev => ({ ...prev, [svc.id]: 0 }))}
                                  className="transition-transform hover:scale-110">
                                  <Star className={cn("w-7 h-7 transition-colors",
                                    s <= (hoverStar[svc.id] || r.stars || 0) ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"
                                  )} />
                                </button>
                              ))}
                              {r.stars && <span className="text-zinc-400 text-sm ml-2 self-center">{["","Muy malo","Malo","Regular","Bueno","Excelente"][r.stars]}</span>}
                            </div>
                            <textarea value={r.comment || ""}
                              onChange={(e) => setRating(prev => ({ ...prev, [svc.id]: { ...prev[svc.id], comment: e.target.value } }))}
                              placeholder="Cuéntanos tu experiencia (opcional)..." rows={2}
                              className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:border-yellow-500" />
                            <Button onClick={() => submitRating(svc.id)} disabled={sendingRating === svc.id || !r.stars}
                              size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold uppercase text-xs h-8">
                              {sendingRating === svc.id
                                ? <span className="animate-spin rounded-full h-3 w-3 border-t-2 border-black" />
                                : <><Send className="w-3 h-3 mr-1" />Enviar calificación</>
                              }
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
