import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { 
  Bike, Search, Car, CheckCircle, Clock, Wrench, User, 
  Phone, MapPin, Settings, Zap, Shield, Star, ChevronRight,
  Droplets, Cog, Disc, Battery
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

// Imágenes de fondo para servicios
const serviceImages = [
  "https://images.unsplash.com/photo-1762604462368-aa69fdbb482e?w=800&q=80",
  "https://images.unsplash.com/photo-1771402629441-95e637743f93?w=800&q=80",
  "https://images.unsplash.com/photo-1762604462286-472334549804?w=800&q=80",
  "https://images.unsplash.com/photo-1767713328609-3ccdca8ef3ab?w=800&q=80",
  "https://images.unsplash.com/photo-1761583780521-7723c3569361?w=800&q=80"
];

// Imagen hero de moto roja
const heroImage = "https://images.unsplash.com/photo-1711435470785-4e1146a16dcc?w=1200&q=80";
const heroImage2 = "https://images.unsplash.com/photo-1771476304049-390cdf3a58a9?w=1200&q=80";

// Servicios ofrecidos
const servicios = [
  {
    icon: Droplets,
    title: "Cambio de Aceite",
    description: "Aceite de alta calidad para tu motor",
    price: "Desde $350 MXN",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    image: "https://images.unsplash.com/photo-1762604462368-aa69fdbb482e?w=600&q=80"
  },
  {
    icon: Settings,
    title: "Servicio Mayor",
    description: "Revisión completa de tu motocicleta",
    price: "Desde $1,200 MXN",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    image: "https://images.unsplash.com/photo-1771402629441-95e637743f93?w=600&q=80"
  },
  {
    icon: Cog,
    title: "Servicio Menor",
    description: "Mantenimiento preventivo básico",
    price: "Desde $600 MXN",
    color: "text-green-400",
    bg: "bg-green-500/10",
    image: "https://images.unsplash.com/photo-1762604462286-472334549804?w=600&q=80"
  },
  {
    icon: Disc,
    title: "Frenos",
    description: "Revisión y cambio de balatas/discos",
    price: "Desde $450 MXN",
    color: "text-red-400",
    bg: "bg-red-500/10",
    image: "https://images.unsplash.com/photo-1767713328609-3ccdca8ef3ab?w=600&q=80"
  },
  {
    icon: Zap,
    title: "Sistema Eléctrico",
    description: "Diagnóstico y reparación eléctrica",
    price: "Desde $300 MXN",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    image: "https://images.unsplash.com/photo-1761583780521-7723c3569361?w=600&q=80"
  },
  {
    icon: Battery,
    title: "Afinación",
    description: "Optimiza el rendimiento de tu moto",
    price: "Desde $500 MXN",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    image: "https://images.unsplash.com/photo-1765161613094-709631a82965?w=600&q=80"
  }
];

const statusSteps = [
  { key: "recibido", label: "Recibido", icon: Car, step: 1 },
  { key: "diagnostico", label: "Diagnóstico", icon: Search, step: 2 },
  { key: "en_reparacion", label: "En Reparación", icon: Wrench, step: 3 },
  { key: "listo", label: "Listo", icon: CheckCircle, step: 4 }
];

export default function LandingPage() {
  const [plate, setPlate] = useState("");
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [hoveredService, setHoveredService] = useState(null);
  const navigate = useNavigate();

  // Cambiar imagen hero automáticamente
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      toast.error("Ingresa la placa de tu vehículo");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${API}/track/${plate.trim().toUpperCase()}`);
      setServiceData(response.data);
      setShowTracking(true);
    } catch (error) {
      setServiceData(null);
      if (error.response?.status === 404) {
        toast.error("No se encontró servicio activo para esta placa");
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

  const scrollToServices = () => {
    document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTracking = () => {
    document.getElementById('rastreo')?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroImages = [heroImage, heroImage2];

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 z-50">
        <div className="h-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bike className="w-8 h-8 text-[#E31837]" />
            <span className="text-xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={scrollToServices} className="text-zinc-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              Servicios
            </button>
            <button onClick={scrollToTracking} className="text-zinc-400 hover:text-white transition-colors text-sm uppercase tracking-wider">
              Rastrear
            </button>
            <a href="tel:+529931234567" className="text-zinc-400 hover:text-white transition-colors text-sm uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-4 h-4" />
              Contacto
            </a>
          </nav>
          <Button
            onClick={() => navigate("/login")}
            data-testid="access-btn"
            className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider text-sm"
          >
            Acceso Personal
          </Button>
        </div>
      </header>

      {/* Hero Section con Imagen de Fondo */}
      <section className="pt-16 relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Image with Transition */}
        <div className="absolute inset-0">
          {heroImages.map((img, idx) => (
            <div
              key={idx}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000",
                currentHeroImage === idx ? "opacity-30" : "opacity-0"
              )}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-[#09090b]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent" />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-20 lg:py-32 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <Badge className="bg-[#E31837]/20 text-[#E31837] border-[#E31837]/30 mb-6 animate-pulse">
                Centro de Servicio Autorizado VENTO
              </Badge>
              <h1 className="text-5xl lg:text-7xl font-bold text-white uppercase leading-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                Tu Motocicleta<br/>
                <span className="text-[#E31837]">En las Mejores Manos</span>
              </h1>
              <p className="text-zinc-400 text-lg mt-6 max-w-lg">
                Servicio profesional para tu motocicleta VENTO. Técnicos certificados, 
                refacciones originales y garantía en todos nuestros trabajos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center lg:justify-start">
                <Button
                  onClick={scrollToServices}
                  data-testid="view-services-btn"
                  className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider h-12 px-8 transition-transform hover:scale-105"
                >
                  Ver Servicios
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  onClick={scrollToTracking}
                  data-testid="track-btn"
                  variant="outline"
                  className="border-zinc-700 text-white hover:bg-zinc-800 font-bold uppercase tracking-wider h-12 px-8"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Rastrear Mi Moto
                </Button>
              </div>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative group">
                <div className="w-80 h-80 bg-[#E31837]/20 rounded-full blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover:bg-[#E31837]/30 transition-all duration-500" />
                <Bike className="w-64 h-64 text-[#E31837] relative z-10 transition-transform duration-500 group-hover:scale-110" strokeWidth={1} />
              </div>
            </div>
          </div>
        </div>

        {/* Animated scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#E31837] rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Servicios Section con Imágenes */}
      <section id="servicios" className="py-20 bg-zinc-950/50 relative">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E31837' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              Nuestros <span className="text-[#E31837]">Servicios</span>
            </h2>
            <p className="text-zinc-500 mt-4 max-w-2xl mx-auto">
              Ofrecemos mantenimiento completo para tu motocicleta VENTO con los más altos estándares de calidad
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servicios.map((servicio, idx) => (
              <Card 
                key={idx} 
                className="bg-zinc-900/50 border-zinc-800 hover:border-[#E31837]/50 transition-all duration-500 group cursor-pointer overflow-hidden relative"
                onMouseEnter={() => setHoveredService(idx)}
                onMouseLeave={() => setHoveredService(null)}
                data-testid={`service-card-${idx}`}
              >
                {/* Background Image on Hover */}
                <div 
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500 z-0",
                    hoveredService === idx ? "opacity-20" : "opacity-0"
                  )}
                  style={{
                    backgroundImage: `url(${servicio.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent transition-opacity duration-500",
                  hoveredService === idx ? "opacity-90" : "opacity-0"
                )} />
                
                <CardContent className="p-6 relative z-10">
                  <div className={cn(
                    "w-14 h-14 rounded-sm flex items-center justify-center mb-4 transition-all duration-300",
                    servicio.bg,
                    hoveredService === idx && "scale-110"
                  )}>
                    <servicio.icon className={cn("w-7 h-7 transition-all duration-300", servicio.color)} />
                  </div>
                  <h3 className="text-xl font-bold text-white uppercase mb-2 transition-transform duration-300 group-hover:translate-x-1" style={{ fontFamily: 'Barlow Condensed' }}>
                    {servicio.title}
                  </h3>
                  <p className="text-zinc-500 text-sm mb-4">
                    {servicio.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#E31837] font-bold text-lg" style={{ fontFamily: 'Barlow Condensed' }}>
                      {servicio.price}
                    </span>
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700 text-xs group-hover:border-[#E31837]/50 group-hover:text-[#E31837] transition-all">
                      Pregunta sin compromiso
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA con imagen de fondo */}
          <div className="mt-12 text-center">
            <Card className="bg-[#E31837]/10 border-[#E31837]/30 max-w-2xl mx-auto relative overflow-hidden">
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url(${serviceImages[2]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <CardContent className="p-8 relative z-10">
                <h3 className="text-2xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                  ¿Necesitas un servicio?
                </h3>
                <p className="text-zinc-400 mb-6">
                  Contáctanos para agendar tu cita. Atención personalizada y presupuesto sin compromiso.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="tel:+529931234567">
                    <Button className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase w-full sm:w-auto transition-transform hover:scale-105">
                      <Phone className="w-5 h-5 mr-2" />
                      Llamar Ahora
                    </Button>
                  </a>
                  <a href="https://wa.me/529931234567" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/20 font-bold uppercase w-full sm:w-auto">
                      WhatsApp
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Por qué elegirnos con imágenes */}
      <section className="py-20 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${serviceImages[0]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#09090b]/95 to-[#09090b]" />
        
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              ¿Por qué <span className="text-[#E31837]">Elegirnos</span>?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-[#E31837]/30 group-hover:scale-110">
                <Shield className="w-8 h-8 text-[#E31837]" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Garantía
              </h3>
              <p className="text-zinc-500">
                Todos nuestros servicios cuentan con garantía. Tu satisfacción es nuestra prioridad.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-[#E31837]/30 group-hover:scale-110">
                <Star className="w-8 h-8 text-[#E31837]" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Experiencia
              </h3>
              <p className="text-zinc-500">
                Más de 10 años de experiencia en servicio de motocicletas VENTO.
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-[#E31837]/30 group-hover:scale-110">
                <Cog className="w-8 h-8 text-[#E31837]" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>
                Refacciones Originales
              </h3>
              <p className="text-zinc-500">
                Utilizamos únicamente refacciones originales y de alta calidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rastreo Section */}
      <section id="rastreo" className="py-20 bg-zinc-950/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              Rastrea tu <span className="text-[#E31837]">Vehículo</span>
            </h2>
            <p className="text-zinc-500 mt-4">
              Si ya tienes tu moto en servicio, ingresa la placa para ver el estado actual
            </p>
          </div>

          {/* Search Form */}
          <Card className="bg-zinc-900/50 border-zinc-800 mb-8">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <Input
                  value={plate}
                  onChange={(e) => setPlate(e.target.value.toUpperCase())}
                  placeholder="Ingresa tu placa (Ej: ABC123)"
                  data-testid="plate-input"
                  className="bg-zinc-950 border-zinc-800 text-white text-xl uppercase tracking-wider h-14 flex-1 text-center font-bold"
                  style={{ fontFamily: 'Barlow Condensed' }}
                />
                <Button
                  type="submit"
                  disabled={loading}
                  data-testid="search-plate-btn"
                  className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase h-14 px-8"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {showTracking && (
            <div className="animate-fade-in">
              {serviceData ? (
                <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden" data-testid="tracking-result">
                  {/* Status Timeline */}
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-6 left-0 right-0 h-1 bg-zinc-800" />
                      <div 
                        className="absolute top-6 left-0 h-1 bg-[#E31837] transition-all duration-500"
                        style={{ width: `${((getCurrentStep() - 1) / 3) * 100}%` }}
                      />
                      {statusSteps.map((step) => {
                        const isCompleted = getCurrentStep() >= step.step;
                        const isCurrent = getCurrentStep() === step.step;
                        return (
                          <div key={step.key} className="flex flex-col items-center relative z-10">
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

                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
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
                            <p className="text-zinc-500 text-xs uppercase mb-1">Cliente</p>
                            <p className="text-white font-medium">{serviceData.client_name}</p>
                          </div>
                          <div className="p-4 bg-zinc-800/30 rounded-sm">
                            <p className="text-zinc-500 text-xs uppercase mb-1">Estado</p>
                            <p className="text-[#E31837] font-bold uppercase">{serviceData.status_label}</p>
                          </div>
                        </div>
                        {serviceData.mechanic_name && (
                          <div className="p-4 bg-zinc-800/30 rounded-sm flex items-center gap-3">
                            <User className="w-5 h-5 text-zinc-500" />
                            <div>
                              <p className="text-zinc-500 text-xs uppercase">Mecánico</p>
                              <p className="text-white font-medium">{serviceData.mechanic_name}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-6 bg-zinc-800/20 rounded-sm border border-zinc-800 flex flex-col items-center justify-center">
                        <p className="text-zinc-500 text-xs uppercase mb-4">Progreso</p>
                        <p className="text-6xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
                          {serviceData.progress}%
                        </p>
                        <Progress value={serviceData.progress} className="h-3 bg-zinc-700 w-full mt-6" />
                        {serviceData.estimated_cost > 0 && (
                          <div className="mt-6 pt-6 border-t border-zinc-800 w-full text-center">
                            <p className="text-zinc-500 text-xs uppercase mb-2">Costo Estimado</p>
                            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
                              ${serviceData.estimated_cost.toLocaleString()} MXN
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-zinc-600 text-sm text-center mt-6">
                      Última actualización: {new Date(serviceData.updated_at).toLocaleString('es-MX')}
                    </p>
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
                      No hay servicio activo para la placa <span className="text-white font-bold">{plate}</span>
                    </p>
                    <p className="text-zinc-600 text-sm mt-2">
                      Si acabas de dejar tu moto, espera a que sea registrada en el sistema
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Bike className="w-8 h-8 text-[#E31837]" />
                <span className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                  YEPEZ CONTROLS
                </span>
              </div>
              <p className="text-zinc-500 text-sm">
                Centro de Servicio Autorizado VENTO. Tu motocicleta en las mejores manos.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
                Contacto
              </h4>
              <div className="space-y-2 text-zinc-500 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  993 123 4567
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Villahermosa, Tabasco
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
                Horario
              </h4>
              <div className="text-zinc-500 text-sm">
                <p>Lunes a Viernes: 8:00 - 18:00</p>
                <p>Sábado: 8:00 - 14:00</p>
                <p>Domingo: Cerrado</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">
              © 2026 YEPEZ CONTROLS - Todos los derechos reservados
            </p>
            <p className="text-zinc-700 text-xs">
              Proyecto de Titulación UJAT - Ingeniería en Sistemas
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
