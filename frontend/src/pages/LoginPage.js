import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bike, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = await login(email, password);
      toast.success(`Bienvenido, ${user.name}`);
      
      if (user.role === "admin") {
        navigate("/admin");
      } else if (user.role === "mecanico") {
        navigate("/mecanico");
      } else {
        navigate("/rastreo");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80"
          alt="Motorcycle"
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
              Centro de Servicio Autorizado VENTO
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-[#09090b]">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Bike className="w-16 h-16 text-[#E31837] mx-auto mb-4" strokeWidth={1.5} />
            <h1 className="text-3xl font-bold text-white tracking-tight uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </h1>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
              Iniciar Sesión
            </h2>
            <p className="text-zinc-500 mt-2">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                data-testid="login-email-input"
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
                  placeholder="••••••••"
                  required
                  data-testid="login-password-input"
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

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-btn"
              className="w-full h-12 bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider rounded-sm transition-all shadow-[0_0_10px_rgba(227,24,55,0.2)] hover:shadow-[0_0_20px_rgba(227,24,55,0.4)]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></span>
                  Ingresando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Ingresar
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
              ¿Eres cliente nuevo?{" "}
              <Link 
                to="/registro" 
                className="text-[#E31837] hover:text-[#C4122C] font-medium transition-colors"
                data-testid="register-link"
              >
                Regístrate aquí
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
