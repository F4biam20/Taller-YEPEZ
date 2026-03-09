import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bike, Eye, EyeOff, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    setLoading(true);
    
    try {
      await register(name, email, password, phone);
      toast.success("¡Registro exitoso! Bienvenido");
      navigate("/rastreo");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&q=80"
          alt="Motorcycle Service"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <Bike className="w-24 h-24 text-[#E31837] mx-auto mb-6" strokeWidth={1.5} />
            <h1 className="text-6xl font-bold text-white tracking-tight uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </h1>
            <p className="text-zinc-400 mt-4 text-lg tracking-wide">
              Portal de Transparencia para Clientes
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-[#09090b]">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-6">
            <Bike className="w-16 h-16 text-[#E31837] mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold text-white tracking-tight uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </h1>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Crear Cuenta
            </h2>
            <p className="text-zinc-500 mt-2">Regístrate para rastrear tu vehículo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-400 text-xs uppercase tracking-widest">
                Nombre Completo
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                required
                data-testid="register-name-input"
                className="bg-zinc-950 border-zinc-800 focus:border-[#E31837] focus:ring-[#E31837] h-12 text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 text-xs uppercase tracking-widest">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                data-testid="register-email-input"
                className="bg-zinc-950 border-zinc-800 focus:border-[#E31837] focus:ring-[#E31837] h-12 text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-zinc-400 text-xs uppercase tracking-widest">
                Teléfono (Opcional)
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="993 123 4567"
                data-testid="register-phone-input"
                className="bg-zinc-950 border-zinc-800 focus:border-[#E31837] focus:ring-[#E31837] h-12 text-white placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400 text-xs uppercase tracking-widest">
                Contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  data-testid="register-password-input"
                  className="bg-zinc-950 border-zinc-800 focus:border-[#E31837] focus:ring-[#E31837] h-12 text-white placeholder:text-zinc-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-400 text-xs uppercase tracking-widest">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite tu contraseña"
                required
                data-testid="register-confirm-password-input"
                className="bg-zinc-950 border-zinc-800 focus:border-[#E31837] focus:ring-[#E31837] h-12 text-white placeholder:text-zinc-600"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="register-submit-btn"
              className="w-full h-12 bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider rounded-sm transition-all shadow-[0_0_10px_rgba(227,24,55,0.2)] hover:shadow-[0_0_20px_rgba(227,24,55,0.4)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Registrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Crear Cuenta
                </span>
              )}
            </Button>
          </form>

          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#09090b] px-2 text-zinc-600">o</span>
              </div>
            </div>

            <p className="text-zinc-500">
              ¿Ya tienes cuenta?{" "}
              <Link 
                to="/login" 
                className="text-[#E31837] hover:text-[#C4122C] font-medium transition-colors"
                data-testid="login-link"
              >
                Inicia sesión
              </Link>
            </p>

            <Link 
              to="/rastreo" 
              className="block text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
              data-testid="track-link"
            >
              Rastrear mi vehículo sin cuenta →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
