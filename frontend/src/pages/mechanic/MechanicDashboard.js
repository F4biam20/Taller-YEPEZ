import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { Wrench, Car, Clock, User, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MechanicDashboard() {
  const { API, getAuthHeaders, user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await axios.get(`${API}/services/mechanic`, getAuthHeaders());
      setServices(response.data);
    } catch (error) {
      toast.error("Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (serviceId, progress) => {
    setUpdating(serviceId);
    try {
      await axios.put(
        `${API}/services/${serviceId}/progress?progress=${progress}`,
        {},
        getAuthHeaders()
      );
      toast.success(progress === 100 ? "¡Servicio completado!" : "Progreso actualizado");
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar");
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      recibido: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      en_reparacion: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      listo: "bg-green-500/20 text-green-400 border-green-500/30"
    };
    const labels = {
      recibido: "Recibido",
      en_reparacion: "En Reparación",
      listo: "Listo"
    };
    return (
      <Badge variant="outline" className={cn("uppercase text-xs", styles[status] || styles.recibido)}>
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

  const activeServices = services.filter(s => s.status !== "listo");
  const completedServices = services.filter(s => s.status === "listo");

  return (
    <div className="space-y-8 animate-fade-in" data-testid="mechanic-dashboard">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
          Mi Cola de Trabajo
        </h1>
        <p className="text-zinc-500 mt-2 flex items-center justify-center lg:justify-start gap-2">
          <User className="w-5 h-5" />
          {user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
              {activeServices.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Pendientes</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-400" style={{ fontFamily: 'Barlow Condensed' }}>
              {completedServices.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Completados</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 col-span-2">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              {services.length > 0 
                ? Math.round(services.reduce((acc, s) => acc + s.progress, 0) / services.length)
                : 0}%
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
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              ¡Sin servicios pendientes!
            </p>
            <p className="text-zinc-500 mt-2">Espera a que te asignen un nuevo trabajo</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {activeServices.map((service) => (
            <Card 
              key={service.id} 
              className="bg-zinc-900/50 border-zinc-800 overflow-hidden"
              data-testid={`mechanic-service-${service.id}`}
            >
              {/* Top highlight bar based on progress */}
              <div 
                className="h-1 bg-gradient-to-r from-[#E31837] to-orange-500" 
                style={{ width: `${service.progress}%` }}
              />
              <CardContent className="p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Vehicle Info */}
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

                    {service.diagnosis && (
                      <div className="p-4 bg-zinc-800/30 rounded-sm">
                        <p className="text-zinc-500 text-xs uppercase tracking-widest mb-2">Diagnóstico</p>
                        <p className="text-white">{service.diagnosis}</p>
                      </div>
                    )}
                  </div>

                  {/* Progress Control */}
                  <div className="lg:w-80 space-y-6 p-6 bg-zinc-800/20 rounded-sm border border-zinc-800">
                    <div className="text-center">
                      <p className="text-6xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
                        {service.progress}%
                      </p>
                      <p className="text-zinc-500 text-sm uppercase tracking-widest">Progreso</p>
                    </div>

                    <Progress value={service.progress} className="h-3 bg-zinc-700" />

                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 uppercase tracking-widest text-center">
                        Actualizar Progreso
                      </p>
                      <Slider
                        value={[service.progress]}
                        max={100}
                        step={10}
                        onValueCommit={(value) => handleProgressUpdate(service.id, value[0])}
                        disabled={updating === service.id}
                        className="py-4"
                        data-testid={`progress-slider-${service.id}`}
                      />
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleProgressUpdate(service.id, 100)}
                      disabled={updating === service.id || service.progress === 100}
                      data-testid={`complete-btn-${service.id}`}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider h-12"
                    >
                      {updating === service.id ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                          Actualizando...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Marcar Completado
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Services */}
      {completedServices.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
              <CheckCircle className="w-5 h-5 text-green-500" />
              Servicios Completados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {completedServices.slice(0, 5).map((service) => (
                <div 
                  key={service.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-sm"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-white font-bold">{service.vehicle_plate}</p>
                      <p className="text-zinc-500 text-sm">{service.client_name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Completado
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
