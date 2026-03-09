import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import axios from "axios";
import { Bike, Search, Car, CheckCircle, Clock, Wrench, User, ArrowRight, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

const statusSteps = [
  { key: "recibido", label: "Recibido", icon: Car, step: 1 },
  { key: "diagnostico", label: "Diagnóstico", icon: Search, step: 2 },
  { key: "en_reparacion", label: "En Reparación", icon: Wrench, step: 3 },
  { key: "listo", label: "Listo", icon: CheckCircle, step: 4 }
];

export default function ClientPortal() {
  const [plate, setPlate] = useState("");
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      toast.error("Ingresa una placa");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await axios.get(`${API}/track/${plate.trim().toUpperCase()}`);
      setServiceData(response.data);
    } catch (error) {
      setServiceData(null);
      if (error.response?.status === 404) {
        toast.error("No se encontró servicio para esta placa");
      } else {
        toast.error("Error al buscar");
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = () => {
    if (!serviceData) return 0;
    return serviceData.current_step || 1;
  };

  return (
    <div className="min-h-screen bg-[#09090b]" data-testid="client-portal">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-sm border-b border-zinc-800 z-50">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bike className="w-8 h-8 text-[#E31837]" />
            <span className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </span>
          </div>
          <Button
              onClick={handleLogin}
              variant="outline"
              data-testid="login-btn"
              className="bg-[#E31837] hover:bg-[#C4122C] text-white border-[#E31837] font-bold"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Ingresar
            </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#E31837]/20 rounded-sm mb-6">
              <Car className="w-10 h-10 text-[#E31837]" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Portal de Transparencia
            </h1>
            <p className="text-zinc-500 mt-3 text-lg">
              Rastrea el estatus de tu vehículo en tiempo real
            </p>
          </div>

          {/* Search Form */}
          <Card className="bg-zinc-900/50 border-zinc-800 mb-8 animate-fade-in">
            <CardContent className="p-6 lg:p-8">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs uppercase tracking-widest">
                    Ingresa la Placa de tu Vehículo
                  </label>
                  <div className="flex gap-3">
                    <Input
                      value={plate}
                      onChange={(e) => setPlate(e.target.value.toUpperCase())}
                      placeholder="Ej: ABC123"
                      data-testid="plate-search-input"
                      className="bg-zinc-950 border-zinc-800 text-white text-2xl uppercase tracking-wider h-14 font-bold text-center"
                      style={{ fontFamily: 'Barlow Condensed' }}
                    />
                    <Button
                      type="submit"
                      disabled={loading}
                      data-testid="search-btn"
                      className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider h-14 px-8"
                    >
                      {loading ? (
                        <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></span>
                      ) : (
                        <Search className="w-6 h-6" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {searched && !loading && (
            <div className="animate-fade-in">
              {serviceData ? (
                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                  {/* Status Timeline */}
                  <div className="p-6 lg:p-8 border-b border-zinc-800">
                    <div className="flex items-center justify-between mb-8 relative">
                      {/* Progress line */}
                      <div className="absolute top-6 left-0 right-0 h-1 bg-zinc-800" />
                      <div 
                        className="absolute top-6 left-0 h-1 bg-[#E31837] transition-all duration-500"
                        style={{ width: `${((getCurrentStep() - 1) / 3) * 100}%` }}
                      />

                      {statusSteps.map((step, index) => {
                        const isCompleted = getCurrentStep() >= step.step;
                        const isCurrent = getCurrentStep() === step.step;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
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

                  {/* Vehicle Details */}
                  <CardContent className="p-6 lg:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column */}
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
                      </div>

                      {/* Right Column - Progress */}
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
                <Card className="bg-zinc-900/50 border-zinc-800">
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

          {/* Info Cards */}
          {!searched && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-sm flex items-center justify-center mx-auto mb-4">
                    <Search className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                    Busca tu Vehículo
                  </h3>
                  <p className="text-zinc-500 text-sm mt-2">
                    Ingresa la placa de tu motocicleta
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-sm flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                    Seguimiento en Tiempo Real
                  </h3>
                  <p className="text-zinc-500 text-sm mt-2">
                    Ve el progreso de tu servicio al instante
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                    100% Transparente
                  </h3>
                  <p className="text-zinc-500 text-sm mt-2">
                    Sin sorpresas, conoce el estatus siempre
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
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
