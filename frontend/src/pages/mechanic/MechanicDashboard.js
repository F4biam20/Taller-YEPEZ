import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import axios from "axios";
import { Car, User, CheckCircle, ClipboardList, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const processOptions = [
  { value: "recibido",      label: "Recibido",      progress: 0   },
  { value: "diagnostico",   label: "Diagnóstico",   progress: 30  },
  { value: "en_reparacion", label: "En reparación", progress: 70  },
  { value: "listo",         label: "Listo",         progress: 100 }
];

export default function MechanicDashboard() {
  const { API, getAuthHeaders, user } = useAuth();
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(null);
  const [drafts, setDrafts]         = useState({});
  const [showHistory, setShowHistory] = useState({});

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services/mechanic`, getAuthHeaders());
      setServices(response.data);
      setDrafts(prev => {
        const next = {};
        response.data.forEach(s => {
          next[s.id] = {
            status:         prev[s.id]?.status         || s.status         || "recibido",
            progress:       prev[s.id]?.progress       ?? s.progress       ?? 0,
            mechanic_notes: "" // siempre limpio para nueva nota
          };
        });
        return next;
      });
    } catch {
      toast.error("Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (id, values) =>
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...values } }));

  const handleProcessChange = (id, status) => {
    const opt = processOptions.find(o => o.value === status);
    updateDraft(id, { status, progress: opt?.progress ?? drafts[id]?.progress ?? 0 });
  };

  const handleSave = async (serviceId, override = {}) => {
    const draft = { ...(drafts[serviceId] || {}), ...override };

    if (!draft.mechanic_notes || draft.mechanic_notes.trim().length < 10) {
      toast.error("⚠️ Escribe una nota descriptiva (mín. 10 caracteres) antes de guardar. Esta nota quedará en la factura del cliente.");
      return;
    }

    setUpdating(serviceId);
    try {
      // Acumular notas: obtener nota anterior y agregar la nueva
      const service = services.find(s => s.id === serviceId);
      const prevNote = service?.mechanic_notes || "";
      const timestamp = new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
      const newNote = prevNote
        ? `${prevNote}\n[${timestamp}] ${draft.mechanic_notes.trim()}`
        : `[${timestamp}] ${draft.mechanic_notes.trim()}`;

      await axios.put(
        `${API}/services/${serviceId}/progress`,
        {
          status:         draft.status,
          progress:       draft.progress,
          mechanic_notes: newNote
        },
        getAuthHeaders()
      );

      toast.success(
        draft.status === "listo"
          ? "✅ ¡Servicio marcado como listo! El cliente puede ver el progreso."
          : "✅ Actualización guardada. La nota quedó registrada en la factura."
      );

      // Limpiar nota del campo y refrescar
      updateDraft(serviceId, { mechanic_notes: "" });
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error al actualizar. Verifica que tengas asignado este servicio.");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      recibido:      "bg-blue-500/20 text-blue-400 border-blue-500/30",
      diagnostico:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      en_reparacion: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      listo:         "bg-green-500/20 text-green-400 border-green-500/30"
    };
    const labels = {
      recibido: "Recibido", diagnostico: "Diagnóstico",
      en_reparacion: "En Reparación", listo: "Listo"
    };
    return (
      <Badge variant="outline" className={cn("uppercase text-xs", styles[status] || styles.recibido)}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]" />
    </div>
  );

  const activeServices    = services.filter(s => s.status !== "listo");
  const completedServices = services.filter(s => s.status === "listo");

  return (
    <div className="space-y-8 animate-fade-in" data-testid="mechanic-dashboard">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
          Mi Cola de Trabajo
        </h1>
        <p className="text-zinc-500 mt-2 flex items-center justify-center lg:justify-start gap-2">
          <User className="w-5 h-5" />{user?.name}
        </p>
      </div>

      {/* Aviso */}
      <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-yellow-300 text-sm">
          <strong>Importante:</strong> Cada vez que guardes, tu nota se acumula en el historial del servicio y quedará en la factura del cliente. Sé descriptivo y claro en cada actualización.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>{activeServices.length}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400" style={{ fontFamily: 'Barlow Condensed' }}>{completedServices.length}</p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Completados</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 col-span-2">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              {services.length > 0 ? Math.round(services.reduce((a, s) => a + s.progress, 0) / services.length) : 0}%
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Progreso Promedio</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Services */}
      {activeServices.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>¡Sin servicios pendientes!</p>
            <p className="text-zinc-500 mt-2">Espera a que te asignen un nuevo trabajo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {activeServices.map((service) => {
            const draft = drafts[service.id] || { status: service.status || "recibido", progress: service.progress || 0, mechanic_notes: "" };
            const notaValida = draft.mechanic_notes?.trim().length >= 10;
            const historialNotas = service.mechanic_notes ? service.mechanic_notes.split("\n").filter(Boolean) : [];
            const isShowingHistory = showHistory[service.id];

            return (
              <Card key={service.id} className="bg-zinc-900/50 border-zinc-800 overflow-hidden" data-testid={`mechanic-service-${service.id}`}>
                <div className="h-1 bg-gradient-to-r from-[#E31837] to-orange-500" style={{ width: `${service.progress}%` }} />
                <CardContent className="p-6 lg:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">

                    {/* Info vehículo */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 bg-[#E31837]/20 rounded-sm flex items-center justify-center">
                            <Car className="w-8 h-8 text-[#E31837]" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                              {service.vehicle_plate}
                            </h2>
                            <p className="text-zinc-400">{service.vehicle_model}</p>
                          </div>
                        </div>
                        {getStatusBadge(service.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="p-3 bg-zinc-800/30 rounded-sm">
                          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Cliente</p>
                          <p className="text-white font-medium">{service.client_name}</p>
                        </div>
                        <div className="p-3 bg-zinc-800/30 rounded-sm">
                          <p className="text-zinc-500 text-xs uppercase tracking-widest mb-1">Turno</p>
                          <p className="text-white font-medium capitalize">{service.shift || "No asignado"}</p>
                        </div>
                      </div>

                      {/* Lo que pidió el cliente */}
                      {service.diagnosis && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-sm">
                          <p className="text-blue-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Solicitud / Diagnóstico del cliente
                          </p>
                          <p className="text-white text-sm">{service.diagnosis}</p>
                        </div>
                      )}

                      {/* Historial de notas acumuladas */}
                      {historialNotas.length > 0 && (
                        <div className="border border-zinc-700 rounded-sm overflow-hidden">
                          <button
                            onClick={() => setShowHistory(prev => ({ ...prev, [service.id]: !prev[service.id] }))}
                            className="w-full flex items-center justify-between p-3 bg-zinc-800/40 hover:bg-zinc-800/60 transition-colors text-sm"
                          >
                            <span className="text-zinc-400 uppercase tracking-wider text-xs font-bold">
                              📋 Historial de notas ({historialNotas.length})
                            </span>
                            {isShowingHistory
                              ? <ChevronUp className="w-4 h-4 text-zinc-500" />
                              : <ChevronDown className="w-4 h-4 text-zinc-500" />
                            }
                          </button>
                          {isShowingHistory && (
                            <div className="p-3 space-y-2 bg-zinc-900/50">
                              {historialNotas.map((nota, i) => (
                                <div key={i} className="text-zinc-300 text-sm p-2 bg-zinc-800/30 rounded-sm border-l-2 border-[#E31837]/50">
                                  {nota}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Control de progreso */}
                    <div className="lg:w-80 space-y-5 p-6 bg-zinc-800/20 rounded-sm border border-zinc-800">
                      <div className="text-center">
                        <p className="text-6xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>{draft.progress}%</p>
                        <p className="text-zinc-500 text-sm uppercase tracking-widest">Progreso</p>
                      </div>

                      <Progress value={draft.progress} className="h-3 bg-zinc-700" />

                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest text-center">Etapa del proceso</p>
                        <Select value={draft.status} onValueChange={(v) => handleProcessChange(service.id, v)}>
                          <SelectTrigger className="bg-zinc-950 border-zinc-700 text-white">
                            <SelectValue placeholder="Seleccionar etapa..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800">
                            {processOptions.map(o => (
                              <SelectItem key={o.value} value={o.value} className="text-white hover:bg-zinc-800">{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <p className="text-xs text-zinc-500 uppercase tracking-widest text-center">Progreso visible</p>
                        <Slider
                          value={[draft.progress]} max={100} step={10}
                          onValueChange={(v) => updateDraft(service.id, { progress: v[0] })}
                          disabled={updating === service.id}
                          className="py-4"
                          data-testid={`progress-slider-${service.id}`}
                        />
                        <div className="flex justify-between text-xs text-zinc-600">
                          <span>0%</span><span>50%</span><span>100%</span>
                        </div>
                      </div>

                      {/* Nota nueva */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-zinc-500 uppercase tracking-widest">Nueva nota *</p>
                          {notaValida
                            ? <span className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Lista</span>
                            : <span className="text-xs text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Requerida</span>
                          }
                        </div>
                        <Textarea
                          value={draft.mechanic_notes}
                          onChange={(e) => updateDraft(service.id, { mechanic_notes: e.target.value })}
                          placeholder="Describe el trabajo realizado en esta actualización. Ej: Se cambió balata delantera, sistema revisado..."
                          className={cn(
                            "bg-zinc-950 text-white min-h-[100px] resize-none transition-colors",
                            notaValida ? "border-green-600" : "border-yellow-600/50"
                          )}
                          data-testid={`mechanic-notes-${service.id}`}
                        />
                        <p className="text-zinc-600 text-xs">
                          {draft.mechanic_notes?.trim().length || 0}/10 mín — Se acumula en el historial de la factura
                        </p>
                      </div>

                      <Button
                        onClick={() => handleSave(service.id)}
                        disabled={updating === service.id}
                        data-testid={`save-process-btn-${service.id}`}
                        className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider h-12"
                      >
                        {updating === service.id
                          ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />Guardando...</span>
                          : <span className="flex items-center gap-2"><ClipboardList className="w-5 h-5" />Guardar y refrescar</span>
                        }
                      </Button>

                      <Button
                        onClick={() => handleSave(service.id, { status: "listo", progress: 100 })}
                        disabled={updating === service.id}
                        data-testid={`complete-btn-${service.id}`}
                        variant="outline"
                        className="w-full border-green-600 text-green-400 hover:bg-green-600/20 font-bold uppercase tracking-wider h-12"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />Marcar Listo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Servicios completados */}
      {completedServices.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
              <CheckCircle className="w-5 h-5 text-green-500" />Servicios Completados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {completedServices.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-bold">{s.vehicle_plate}</p>
                      <p className="text-zinc-500 text-sm">{s.client_name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">Completado</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
