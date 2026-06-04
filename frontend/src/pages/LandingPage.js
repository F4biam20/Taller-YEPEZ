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
  Droplets, Cog, Disc, Battery, X, Package, ShoppingBag,
  AlertCircle, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.REACT_APP_BACKEND_URL + "/api";

// Opiniones de ejemplo (se mezclan con las reales del backend)
const opinionesEjemplo = [
  { name: "Carlos M.",    stars: 5, comment: "Excelente servicio, mi moto quedó como nueva. Muy profesionales.", date: "Mayo 2026" },
  { name: "Laura G.",     stars: 5, comment: "Rápidos y honestos. Me explicaron todo el proceso. 100% recomendados.", date: "Abril 2026" },
  { name: "Roberto S.",   stars: 4, comment: "Buen trabajo en mi VENTO Bravo. El precio fue justo.", date: "Marzo 2026" },
  { name: "Ana P.",       stars: 5, comment: "Llevé mi moto por un problema eléctrico y lo resolvieron el mismo día.", date: "Febrero 2026" },
  { name: "Miguel H.",    stars: 5, comment: "Refacciones originales y garantía real. No busco otro taller.", date: "Enero 2026" },
];

const serviceImages = [
  "https://images.unsplash.com/photo-1762604462368-aa69fdbb482e?w=800&q=80",
  "https://images.unsplash.com/photo-1771402629441-95e637743f93?w=800&q=80",
  "https://images.unsplash.com/photo-1762604462286-472334549804?w=800&q=80",
  "https://images.unsplash.com/photo-1767713328609-3ccdca8ef3ab?w=800&q=80",
  "https://images.unsplash.com/photo-1761583780521-7723c3569361?w=800&q=80"
];

const heroImage = "https://images.unsplash.com/photo-1711435470785-4e1146a16dcc?w=1200&q=80";
const heroImage2 = "https://images.unsplash.com/photo-1771476304049-390cdf3a58a9?w=1200&q=80";

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

  // Modales
  const [modal, setModal] = useState(null); // "garantia" | "experiencia" | "refacciones"
  const [inventory, setInventory] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [searchPart, setSearchPart] = useState("");
  const [partRequest, setPartRequest] = useState({ name: "", phone: "", part: "", notes: "" });
  const [showRequestForm, setShowRequestForm] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openModal = async (type) => {
    setModal(type);
    setLoadingModal(true);
    try {
      if (type === "refacciones") {
        const res = await axios.get(`${API}/public/inventory`);
        setInventory(res.data);
      }
      if (type === "experiencia") {
        const res = await axios.get(`${API}/public/ratings`);
        setRatings(res.data);
      }
    } catch { /* usa datos de ejemplo si falla */ }
    finally { setLoadingModal(false); }
  };

  const closeModal = () => {
    setModal(null);
    setShowRequestForm(null);
    setPartRequest({ name: "", phone: "", part: "", notes: "" });
    setCategoryFilter("Todos");
    setSearchPart("");
  };

  const handlePartRequest = async (e) => {
    e.preventDefault();
    if (!partRequest.name || !partRequest.phone) {
      toast.error("Completa nombre y teléfono");
      return;
    }
    setSendingRequest(true);
    try {
      await axios.post(`${API}/public/parts-request`, partRequest);
      toast.success("✅ Solicitud enviada. Te contactaremos pronto.");
      setShowRequestForm(null);
      setPartRequest({ name: "", phone: "", part: "", notes: "" });
    } catch {
      toast.error("Error al enviar solicitud");
    } finally {
      setSendingRequest(false);
    }
  };

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
          {/* ===== BOTONES HEADER ===== */}
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigate("/registro")}
              className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider text-sm"
            >
              Cliente Nuevo
            </Button>
            <Button
              onClick={() => navigate("/login")}
              data-testid="access-btn"
              className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider text-sm"
            >
              Acceso Personal
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-16 relative overflow-hidden min-h-[90vh] flex items-center">
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

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-zinc-600 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-[#E31837] rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Servicios Section */}
      <section id="servicios" className="py-20 bg-zinc-950/50 relative">
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
                  <p className="text-zinc-500 text-sm mb-4">{servicio.description}</p>
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

      {/* Por qué elegirnos — Cards clickeables */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url(${serviceImages[0]})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b] via-[#09090b]/95 to-[#09090b]" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              ¿Por qué <span className="text-[#E31837]">Elegirnos</span>?
            </h2>
            <p className="text-zinc-500 mt-2 text-sm">Haz clic en cada tarjeta para conocer más</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Garantía */}
            <button onClick={() => openModal("garantia")} className="text-center group cursor-pointer w-full">
              <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-[#E31837]/40 group-hover:scale-110">
                <Shield className="w-8 h-8 text-[#E31837]" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>Garantía</h3>
              <p className="text-zinc-500 text-sm">Todos nuestros servicios cuentan con garantía VENTO certificada.</p>
              <span className="text-[#E31837] text-xs mt-2 block">Ver detalles →</span>
            </button>
            {/* Experiencia */}
            <button onClick={() => openModal("experiencia")} className="text-center group cursor-pointer w-full">
              <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-[#E31837]/40 group-hover:scale-110">
                <Star className="w-8 h-8 text-[#E31837]" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>Experiencia</h3>
              <p className="text-zinc-500 text-sm">Más de 10 años especializados en motocicletas VENTO.</p>
              <span className="text-[#E31837] text-xs mt-2 block">Ver opiniones →</span>
            </button>
            {/* Refacciones */}
            <button onClick={() => openModal("refacciones")} className="text-center group cursor-pointer w-full">
              <div className="w-16 h-16 bg-[#E31837]/20 rounded-sm flex items-center justify-center mx-auto mb-4 transition-all duration-300 group-hover:bg-[#E31837]/40 group-hover:scale-110">
                <Cog className="w-8 h-8 text-[#E31837]" />
              </div>
              <h3 className="text-xl font-bold text-white uppercase mb-2" style={{ fontFamily: 'Barlow Condensed' }}>Refacciones Originales</h3>
              <p className="text-zinc-500 text-sm">Catálogo completo de piezas originales VENTO con stock en tiempo real.</p>
              <span className="text-[#E31837] text-xs mt-2 block">Ver catálogo →</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===== MODAL GARANTÍA ===== */}
      {modal === "garantia" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-[#E31837] p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>Garantía YEPEZ CONTROLS</h2>
                  <p className="text-red-200 text-sm">Centro de Servicio Autorizado VENTO</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white hover:text-red-200 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Banner imagen */}
              <div className="rounded-sm overflow-hidden h-48 relative">
                <img src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80" alt="Garantía" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 to-transparent flex items-end p-4">
                  <p className="text-white font-bold text-lg uppercase" style={{ fontFamily: 'Barlow Condensed' }}>Tu tranquilidad es nuestra prioridad</p>
                </div>
              </div>

              {/* Qué cubre */}
              <div>
                <h3 className="text-white font-bold uppercase mb-4 text-lg" style={{ fontFamily: 'Barlow Condensed' }}>¿Qué cubre nuestra garantía?</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: "🔧", title: "Mano de obra", desc: "3 meses en todos los servicios realizados" },
                    { icon: "⚙️", title: "Refacciones originales", desc: "6 meses en piezas instaladas por nosotros" },
                    { icon: "🛡️", title: "Garantía VENTO", desc: "Respaldados por la marca para motos nuevas" },
                    { icon: "✅", title: "Revisión gratuita", desc: "Revisión post-servicio sin costo a los 15 días" },
                    { icon: "📋", title: "Diagnóstico sin cargo", desc: "Si el problema regresa dentro de garantía" },
                    { icon: "🤝", title: "Satisfacción garantizada", desc: "Si no quedas satisfecho, lo revisamos sin costo" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-zinc-800/40 rounded-sm">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <p className="text-white font-medium text-sm">{item.title}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Condiciones */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4">
                <p className="text-yellow-400 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Condiciones de garantía
                </p>
                <ul className="text-zinc-400 text-xs space-y-1 list-disc list-inside">
                  <li>Válida únicamente con comprobante de servicio YEPEZ CONTROLS</li>
                  <li>No aplica para daños por mal uso o accidentes</li>
                  <li>Requiere presentar moto en el taller para evaluación</li>
                  <li>Garantía de refacciones sujeta a disponibilidad del fabricante</li>
                </ul>
              </div>

              <Button onClick={() => { closeModal(); navigate("/registro"); }}
                className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase h-12">
                Agendar cita con garantía →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL EXPERIENCIA ===== */}
      {modal === "experiencia" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-[#E31837] p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>Nuestra Experiencia</h2>
                  <p className="text-red-200 text-sm">Lo que dicen nuestros clientes</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white hover:text-red-200 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "10+", label: "Años de experiencia" },
                  { value: "500+", label: "Motos atendidas" },
                  { value: "98%", label: "Clientes satisfechos" },
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 bg-zinc-800/40 rounded-sm">
                    <p className="text-3xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>{stat.value}</p>
                    <p className="text-zinc-500 text-xs uppercase mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Especialización */}
              <div className="rounded-sm overflow-hidden h-40 relative">
                <img src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80" alt="Taller" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-zinc-900/70 flex items-center justify-center p-4">
                  <p className="text-white text-center text-sm leading-relaxed">
                    Nos hemos especializado durante más de <strong>10 años</strong> en el servicio exclusivo de motocicletas <strong>VENTO</strong>. 
                    Nuestros técnicos están certificados directamente por la marca y se actualizan constantemente.
                  </p>
                </div>
              </div>

              {/* Opiniones */}
              <div>
                <h3 className="text-white font-bold uppercase mb-4" style={{ fontFamily: 'Barlow Condensed' }}>
                  Opiniones de clientes
                  {loadingModal && <span className="text-zinc-500 text-xs ml-2 font-normal">Cargando...</span>}
                </h3>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {/* Opiniones reales del backend primero */}
                  {ratings.map((r, i) => (
                    <div key={`real-${i}`} className="p-4 bg-zinc-800/40 rounded-sm border-l-2 border-[#E31837]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium text-sm">{r.client_name || "Cliente verificado"}</span>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={cn("w-3 h-3", s <= r.stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-600")} />
                          ))}
                        </div>
                      </div>
                      {r.comment && <p className="text-zinc-400 text-xs italic">"{r.comment}"</p>}
                    </div>
                  ))}
                  {/* Opiniones de ejemplo */}
                  {opinionesEjemplo.map((op, i) => (
                    <div key={`ej-${i}`} className="p-4 bg-zinc-800/40 rounded-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-white font-medium text-sm">{op.name}</span>
                          <span className="text-zinc-600 text-xs ml-2">{op.date}</span>
                        </div>
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={cn("w-3 h-3", s <= op.stars ? "text-yellow-400 fill-yellow-400" : "text-zinc-600")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-zinc-400 text-xs italic">"{op.comment}"</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={() => { closeModal(); navigate("/registro"); }}
                className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase h-12">
                Únete a nuestros clientes satisfechos →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL REFACCIONES ===== */}
      {modal === "refacciones" && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-[#E31837] p-6 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>Catálogo de Refacciones</h2>
                  <p className="text-red-200 text-sm">100% originales VENTO — Stock en tiempo real</p>
                </div>
              </div>
              <button onClick={closeModal} className="text-white hover:text-red-200 transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Búsqueda y filtro */}
              <div className="flex gap-3 flex-wrap">
                <input
                  value={searchPart}
                  onChange={e => setSearchPart(e.target.value)}
                  placeholder="Buscar refacción..."
                  className="flex-1 bg-zinc-950 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#E31837] min-w-[200px]"
                />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-white rounded-md px-3 py-2 text-sm focus:outline-none">
                  <option value="Todos">Todas las categorías</option>
                  {[...new Set(inventory.map(i => i.category))].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {loadingModal ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E31837]" />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {inventory
                    .filter(item =>
                      (categoryFilter === "Todos" || item.category === categoryFilter) &&
                      item.name.toLowerCase().includes(searchPart.toLowerCase())
                    )
                    .map((item) => {
                      const inStock = item.quantity > 0;
                      return (
                        <div key={item.id || item.sku} className={cn(
                          "p-4 rounded-sm border transition-all",
                          inStock ? "bg-zinc-800/40 border-zinc-700 hover:border-[#E31837]/50" : "bg-zinc-800/20 border-zinc-800 opacity-60"
                        )}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1">
                              <p className="text-white font-medium text-sm">{item.name}</p>
                              <p className="text-zinc-500 text-xs">{item.category} — SKU: {item.sku}</p>
                            </div>
                            <Badge className={cn("text-xs border shrink-0",
                              inStock ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                            )}>
                              {inStock ? `${item.quantity} pzs` : "Agotado"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#E31837] font-bold text-lg" style={{ fontFamily: 'Barlow Condensed' }}>
                              ${item.unit_price.toLocaleString()} MXN
                            </span>
                            {inStock ? (
                              <button
                                onClick={() => setShowRequestForm(item.sku)}
                                className="text-xs bg-[#E31837] hover:bg-[#C4122C] text-white px-3 py-1.5 rounded-sm font-bold uppercase transition-colors flex items-center gap-1"
                              >
                                <ShoppingBag className="w-3 h-3" /> Apartar
                              </button>
                            ) : (
                              <span className="text-zinc-600 text-xs">Sin disponibilidad</span>
                            )}
                          </div>

                          {/* Formulario de solicitud */}
                          {showRequestForm === item.sku && (
                            <form onSubmit={handlePartRequest} className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
                              <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Datos para apartar</p>
                              <input
                                value={partRequest.name}
                                onChange={e => setPartRequest(p => ({ ...p, name: e.target.value, part: item.name }))}
                                placeholder="Tu nombre *"
                                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-1.5 text-xs focus:outline-none focus:border-green-500"
                                required
                              />
                              <input
                                value={partRequest.phone}
                                onChange={e => setPartRequest(p => ({ ...p, phone: e.target.value }))}
                                placeholder="Tu teléfono *"
                                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-1.5 text-xs focus:outline-none focus:border-green-500"
                                required
                              />
                              <textarea
                                value={partRequest.notes}
                                onChange={e => setPartRequest(p => ({ ...p, notes: e.target.value }))}
                                placeholder="Modelo de tu moto (opcional)"
                                rows={2}
                                className="w-full bg-zinc-950 border border-zinc-700 text-white rounded px-3 py-1.5 text-xs resize-none focus:outline-none focus:border-green-500"
                              />
                              <div className="flex gap-2">
                                <button type="submit" disabled={sendingRequest}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-2 rounded font-bold uppercase">
                                  {sendingRequest ? "Enviando..." : "Confirmar solicitud"}
                                </button>
                                <button type="button" onClick={() => setShowRequestForm(null)}
                                  className="text-zinc-500 hover:text-white text-xs px-3 py-2 rounded border border-zinc-700">
                                  Cancelar
                                </button>
                              </div>
                              <p className="text-zinc-600 text-xs text-center">
                                📍 Recoge en sucursal: Villahermosa, Tabasco
                              </p>
                            </form>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {inventory.filter(i =>
                (categoryFilter === "Todos" || i.category === categoryFilter) &&
                i.name.toLowerCase().includes(searchPart.toLowerCase())
              ).length === 0 && !loadingModal && (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No se encontraron refacciones</p>
                </div>
              )}

              <div className="bg-zinc-800/30 rounded-sm p-4 text-center">
                <p className="text-zinc-400 text-sm">¿No encuentras la pieza que necesitas?</p>
                <a href="tel:+529931234567" className="text-[#E31837] font-bold text-sm hover:underline flex items-center justify-center gap-1 mt-1">
                  <Phone className="w-4 h-4" /> Llámanos: 993 123 4567
                </a>
              </div>
            </div>
          </div>
        </div>
      )}


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
              <h4 className="text-white font-bold uppercase mb-4" style={{ fontFamily: 'Barlow Condensed' }}>Contacto</h4>
              <div className="space-y-2 text-zinc-500 text-sm">
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" />993 123 4567</p>
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4" />Villahermosa, Tabasco</p>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold uppercase mb-4" style={{ fontFamily: 'Barlow Condensed' }}>Horario</h4>
              <div className="text-zinc-500 text-sm">
                <p>Lunes a Viernes: 8:00 - 18:00</p>
                <p>Sábado: 8:00 - 14:00</p>
                <p>Domingo: Cerrado</p>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-600 text-sm">© 2026 YEPEZ CONTROLS - Todos los derechos reservados</p>
            <p className="text-zinc-700 text-xs">Proyecto de Titulación UJAT - Ingeniería en Sistemas</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
