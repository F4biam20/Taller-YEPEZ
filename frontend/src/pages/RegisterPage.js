import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { Bike, User, Mail, Phone, Lock, Eye, EyeOff, ChevronRight, ArrowLeft, CheckCircle, RefreshCw } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";
const EMAILJS_SERVICE_ID = "service_5vom38o";
const EMAILJS_TEMPLATE_ID = "template_86387s7";
const EMAILJS_PUBLIC_KEY = "haQ6zpY-s7oKu4kdB";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });
  const [code, setCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }, []);

  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const sendCode = async (email, name, code) => {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: email,
      name: name,
      code: code,
    });
  };

  // Paso 1 — Registro
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }
    if (form.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      // 1. Registrar en backend — devuelve el código generado
      const res = await axios.post(`${API}/auth/register`, {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null
      });

      // 2. Enviar código por EmailJS
      const backendCode = res.data.code;
      setGeneratedCode(backendCode);
      await sendCode(form.email.trim(), form.name.trim(), backendCode);

      toast.success("¡Revisa tu correo! Te enviamos un código de verificación");
      setStep(2);
    } catch (error) {
      const msg = error?.response?.data?.detail || "Error al crear la cuenta";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Paso 2 — Verificación
  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error("El código debe tener 6 dígitos");
      return;
    }
    if (code.trim() !== generatedCode) {
      toast.error("Código incorrecto, verifica tu correo");
      return;
    }
    setLoading(true);
    try {
      // Verificar en backend
      const res = await axios.post(`${API}/auth/verify-email`, {
        email: form.email.trim(),
        code: code.trim()
      });
      localStorage.setItem("token", res.data.token);
      toast.success("¡Cuenta verificada! Bienvenido a YEPEZ CONTROLS");
      window.location.href = "/cliente";
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Error al verificar");
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResend = async () => {
    setResending(true);
    try {
      const res = await axios.post(`${API}/auth/resend-code`, null, { params: { email: form.email.trim() } });
      const newCode = res.data.code;
      setGeneratedCode(newCode);
      await sendCode(form.email.trim(), form.name.trim(), newCode);
      toast.success("Código reenviado a tu correo");
    } catch (error) {
      toast.error("No se pudo reenviar el código");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col">
      {/* Header */}
      <header className="h-16 bg-zinc-950/95 border-b border-zinc-800 flex items-center px-4">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Bike className="w-7 h-7 text-[#E31837]" />
            <span className="text-lg font-bold text-white uppercase tracking-tight">
              YEPEZ<span className="text-[#E31837]"> CONTROLS</span>
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${step >= 1 ? "text-white" : "text-zinc-600"}`}>
              <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold ${step > 1 ? "bg-green-600 text-white" : step === 1 ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-600"}`}>
                {step > 1 ? <CheckCircle className="w-4 h-4" /> : "1"}
              </div>
              Datos
            </div>
            <div className={`w-8 h-px ${step >= 2 ? "bg-green-600" : "bg-zinc-700"}`} />
            <div className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wider ${step >= 2 ? "text-white" : "text-zinc-600"}`}>
              <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-600"}`}>
                2
              </div>
              Verificar
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800 rounded-sm p-8">

            {/* ===== PASO 1: FORMULARIO ===== */}
            {step === 1 && (
              <>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-sm flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Crear Cuenta</h1>
                  <p className="text-zinc-500 text-sm mt-2">Regístrate para rastrear tu moto y gestionar citas</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Nombre completo *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input name="name" value={form.name} onChange={handleChange}
                        placeholder="Tu nombre completo"
                        className="bg-zinc-950 border-zinc-700 text-white pl-10 h-11 focus:border-green-500" required />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Correo electrónico *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input name="email" type="email" value={form.email} onChange={handleChange}
                        placeholder="tu@correo.com"
                        className="bg-zinc-950 border-zinc-700 text-white pl-10 h-11 focus:border-green-500" required />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">
                      Teléfono <span className="text-zinc-600">(opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input name="phone" type="tel" value={form.phone} onChange={handleChange}
                        placeholder="9931234567"
                        className="bg-zinc-950 border-zinc-700 text-white pl-10 h-11 focus:border-green-500" />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        className="bg-zinc-950 border-zinc-700 text-white pl-10 pr-10 h-11 focus:border-green-500" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block">Confirmar contraseña *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <Input name="confirmPassword" type={showConfirm ? "text" : "password"} value={form.confirmPassword} onChange={handleChange}
                        placeholder="Repite tu contraseña"
                        className="bg-zinc-950 border-zinc-700 text-white pl-10 pr-10 h-11 focus:border-green-500" required />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider h-11 mt-2">
                    {loading
                      ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                      : <><span>Continuar</span><ChevronRight className="w-4 h-4 ml-2" /></>
                    }
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800 text-center space-y-2">
                  <p className="text-zinc-500 text-sm">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-green-400 hover:text-green-300 font-medium">Inicia sesión aquí</Link>
                  </p>
                  <p className="text-zinc-600 text-xs">
                    ¿Eres del taller?{" "}
                    <Link to="/login" className="text-[#E31837] hover:text-red-400">Acceso personal →</Link>
                  </p>
                </div>
              </>
            )}

            {/* ===== PASO 2: VERIFICACIÓN ===== */}
            {step === 2 && (
              <>
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-sm flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white uppercase tracking-wide">Verifica tu correo</h1>
                  <p className="text-zinc-500 text-sm mt-2">Enviamos un código de 6 dígitos a</p>
                  <p className="text-white font-medium text-sm mt-1">{form.email}</p>
                </div>

                <form onSubmit={handleVerify} className="space-y-4">
                  <div>
                    <label className="text-zinc-400 text-xs uppercase tracking-wider mb-1.5 block text-center">
                      Código de verificación
                    </label>
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="bg-zinc-950 border-zinc-700 text-white h-14 text-center text-3xl tracking-[1rem] font-bold focus:border-green-500"
                    />
                    <p className="text-zinc-600 text-xs text-center mt-2">El código expira en 15 minutos</p>
                  </div>

                  <Button type="submit" disabled={loading || code.length !== 6}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider h-11">
                    {loading
                      ? <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                      : <><CheckCircle className="w-4 h-4 mr-2" /><span>Verificar y entrar</span></>
                    }
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800 text-center space-y-3">
                  <p className="text-zinc-500 text-sm">¿No recibiste el correo?</p>
                  <button onClick={handleResend} disabled={resending}
                    className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium transition-colors mx-auto">
                    <RefreshCw className={`w-4 h-4 ${resending ? "animate-spin" : ""}`} />
                    {resending ? "Reenviando..." : "Reenviar código"}
                  </button>
                  <p className="text-zinc-600 text-xs">Revisa también tu carpeta de spam</p>
                  <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors">
                    ← Cambiar correo electrónico
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
