import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Lock, 
  Unlock, 
  CheckCircle,
  Calculator,
  FileText,
  FileSpreadsheet,
  Tag,
  Receipt,
  Wallet,
  Plus,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Códigos de promoción
const PROMO_CODES = {
  "VENTO10": { discount: 10, type: "percent", description: "10% de descuento" },
  "VENTO20": { discount: 20, type: "percent", description: "20% de descuento" },
  "UJAT2026": { discount: 15, type: "percent", description: "15% descuento UJAT" },
  "PRIMERAVEZ": { discount: 100, type: "fixed", description: "$100 MXN descuento" },
  "SERVICIO50": { discount: 50, type: "fixed", description: "$50 MXN descuento" }
};

export default function Finances() {
  const { API, getAuthHeaders } = useAuth();
  const [services, setServices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [weeklyCuts, setWeeklyCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [cutDialogOpen, setCutDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isSaturday, setIsSaturday] = useState(false);
  
  // Caja - Estados del formulario
  const [total, setTotal] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [efectivoRecibido, setEfectivoRecibido] = useState("");
  const [montoTransferencia, setMontoTransferencia] = useState("");
  const [referenciaTransfer, setReferenciaTransfer] = useState("");
  
  // Cut form
  const [cutPin, setCutPin] = useState("");
  const [cutNotes, setCutNotes] = useState("");

  useEffect(() => {
    fetchData();
    checkSaturday();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, paymentsRes, cutsRes] = await Promise.all([
        axios.get(`${API}/services`, getAuthHeaders()),
        axios.get(`${API}/payments`, getAuthHeaders()),
        axios.get(`${API}/weekly-cuts`, getAuthHeaders())
      ]);
      // Mostrar servicios pendientes de pago
      setServices(servicesRes.data.filter(s => s.payment_status === "pendiente"));
      setPayments(paymentsRes.data);
      setWeeklyCuts(cutsRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const checkSaturday = async () => {
    try {
      const response = await axios.get(`${API}/weekly-cut/check-saturday`);
      setIsSaturday(response.data.is_saturday);
    } catch (error) {}
  };

  // ============ CÁLCULOS ============
  const totalNum = parseFloat(total || 0);
  let descuento = 0;
  if (promoApplied) {
    descuento = promoApplied.type === "percent" 
      ? (totalNum * promoApplied.discount) / 100 
      : promoApplied.discount;
  }
  const totalFinal = Math.max(0, totalNum - descuento);
  
  // Para pago mixto
  const transferNum = parseFloat(montoTransferencia || 0);
  const restanteEfectivo = Math.max(0, totalFinal - transferNum);
  const efectivoNum = parseFloat(efectivoRecibido || 0);
  const cambio = metodoPago === "efectivo" 
    ? Math.max(0, efectivoNum - totalFinal)
    : metodoPago === "mixto"
      ? Math.max(0, efectivoNum - restanteEfectivo)
      : 0;

  const applyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (PROMO_CODES[code]) {
      setPromoApplied(PROMO_CODES[code]);
      toast.success(`¡Código aplicado! ${PROMO_CODES[code].description}`);
    } else {
      toast.error("Código inválido");
      setPromoApplied(null);
    }
  };

  const openPayDialog = (service) => {
    setSelectedService(service);
    setTotal(service.estimated_cost?.toString() || "0");
    setPromoCode("");
    setPromoApplied(null);
    setMetodoPago("efectivo");
    setEfectivoRecibido("");
    setMontoTransferencia("");
    setReferenciaTransfer("");
    setPayDialogOpen(true);
  };

  const handlePayment = async () => {
    if (totalFinal <= 0) {
      toast.error("El total debe ser mayor a $0");
      return;
    }

    // Validaciones según método de pago
    if (metodoPago === "efectivo") {
      if (efectivoNum < totalFinal) {
        toast.error(`Efectivo insuficiente. Faltan $${(totalFinal - efectivoNum).toFixed(2)} MXN`);
        return;
      }
    } else if (metodoPago === "transferencia") {
      if (!referenciaTransfer.trim()) {
        toast.error("Ingresa la referencia de la transferencia");
        return;
      }
    } else if (metodoPago === "mixto") {
      if (transferNum <= 0) {
        toast.error("Ingresa el monto de transferencia");
        return;
      }
      if (!referenciaTransfer.trim()) {
        toast.error("Ingresa la referencia de la transferencia");
        return;
      }
      if (efectivoNum < restanteEfectivo) {
        toast.error(`Efectivo insuficiente. Faltan $${(restanteEfectivo - efectivoNum).toFixed(2)} MXN`);
        return;
      }
    }

    try {
      let paymentData = {
        service_id: selectedService.id,
        total_amount: totalFinal,
        notes: promoApplied ? `Promo: ${promoCode}` : ""
      };

      if (metodoPago === "efectivo") {
        paymentData.transfer_amount = 0;
        paymentData.cash_amount = totalFinal;
        paymentData.cash_received = efectivoNum;
        paymentData.transfer_reference = null;
      } else if (metodoPago === "transferencia") {
        paymentData.transfer_amount = totalFinal;
        paymentData.cash_amount = 0;
        paymentData.cash_received = 0;
        paymentData.transfer_reference = referenciaTransfer;
      } else if (metodoPago === "mixto") {
        paymentData.transfer_amount = transferNum;
        paymentData.cash_amount = restanteEfectivo;
        paymentData.cash_received = efectivoNum;
        paymentData.transfer_reference = referenciaTransfer;
      }

      await axios.post(`${API}/payments`, paymentData, getAuthHeaders());

      if (cambio > 0) {
        toast.success(`✓ Pago registrado. CAMBIO: $${cambio.toFixed(2)} MXN`, { duration: 6000 });
      } else {
        toast.success("✓ Pago registrado correctamente");
      }
      
      setPayDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al procesar pago");
    }
  };

  const handleWeeklyCut = async () => {
    try {
      await axios.post(`${API}/weekly-cut`, { pin: cutPin, notes: cutNotes }, getAuthHeaders());
      toast.success("Corte semanal realizado");
      setCutDialogOpen(false);
      setCutPin("");
      setCutNotes("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "PIN incorrecto");
    }
  };

  // Exportar PDF
  const exportPDF = async () => {
    try {
      const response = await axios.get(`${API}/reports/sales/export`, getAuthHeaders());
      const data = response.data;
      
      const doc = new jsPDF();
      doc.setFillColor(227, 24, 55);
      doc.rect(0, 0, 220, 30, 'F');
      doc.setFontSize(20);
      doc.setTextColor(255);
      doc.text("YEPEZ CONTROLS - Reporte de Ventas", 105, 18, { align: "center" });
      
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 40);
      doc.text(`Total: $${data.summary.total_revenue.toLocaleString()} MXN`, 14, 48);
      doc.text(`Efectivo: $${data.summary.cash_total.toLocaleString()} MXN | Transferencias: $${data.summary.transfer_total.toLocaleString()} MXN`, 14, 56);
      
      if (data.payments?.length > 0) {
        autoTable(doc, {
          startY: 65,
          head: [["Placa", "Cliente", "Total", "Método", "Fecha"]],
          body: data.payments.map(p => [
            p.vehicle_plate || "N/A",
            p.client_name || "N/A",
            `$${p.total_amount?.toLocaleString()} MXN`,
            p.transfer_amount > 0 ? (p.cash_amount > 0 ? "Mixto" : "Transfer") : "Efectivo",
            new Date(p.created_at).toLocaleDateString('es-MX')
          ]),
          headStyles: { fillColor: [227, 24, 55] }
        });
      }
      
      doc.save(`ventas_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF generado");
    } catch (error) {
      toast.error("Error al generar PDF");
    }
  };

  // Exportar Excel
  const exportExcel = async () => {
    try {
      const response = await axios.get(`${API}/reports/sales/export`, getAuthHeaders());
      const data = response.data;
      
      const wsData = [
        ["YEPEZ CONTROLS - Reporte de Ventas"],
        [`Generado: ${new Date().toLocaleString('es-MX')}`],
        [],
        ["Total", `$${data.summary.total_revenue} MXN`],
        ["Efectivo", `$${data.summary.cash_total} MXN`],
        ["Transferencias", `$${data.summary.transfer_total} MXN`],
        [],
        ["Placa", "Cliente", "Total", "Efectivo", "Transfer", "Fecha"],
        ...data.payments.map(p => [
          p.vehicle_plate, p.client_name, p.total_amount, p.cash_amount, p.transfer_amount,
          new Date(p.created_at).toLocaleDateString('es-MX')
        ])
      ];

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ventas");
      const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buffer]), `ventas_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Excel generado");
    } catch (error) {
      toast.error("Error al generar Excel");
    }
  };

  const totalRevenue = payments.reduce((acc, p) => acc + p.total_amount, 0);
  const totalCash = payments.reduce((acc, p) => acc + p.cash_amount, 0);
  const totalTransfers = payments.reduce((acc, p) => acc + p.transfer_amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="finances-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            Caja
          </h1>
          <p className="text-zinc-500 mt-1">Sistema de cobros y cortes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportExcel} variant="outline" className="border-green-600 text-green-400 hover:bg-green-600/20">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportPDF} variant="outline" className="border-red-600 text-red-400 hover:bg-red-600/20">
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Dialog open={cutDialogOpen} onOpenChange={setCutDialogOpen}>
            <DialogTrigger asChild>
              <Button className={cn("font-bold uppercase", isSaturday ? "bg-[#E31837] hover:bg-[#C4122C] text-white" : "bg-zinc-800 text-zinc-400")}>
                {isSaturday ? <Unlock className="w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                Corte Semanal
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white uppercase flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
                  <Lock className="w-6 h-6 text-[#E31837]" />
                  Corte Semanal
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className={cn("text-sm p-3 rounded-sm", isSaturday ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400")}>
                  {isSaturday ? "✓ Habilitado (es sábado)" : "⚠ Solo sábados - Ingresa PIN para continuar"}
                </p>
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">PIN</Label>
                  <Input type="password" value={cutPin} onChange={(e) => setCutPin(e.target.value)} placeholder="UJAT2026" className="bg-zinc-950 border-zinc-800 text-white text-center text-xl" />
                </div>
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Notas</Label>
                  <Input value={cutNotes} onChange={(e) => setCutNotes(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white" />
                </div>
                <Button onClick={handleWeeklyCut} className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase">
                  Ejecutar Corte
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Total Ingresos</p>
              <p className="text-3xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>${totalRevenue.toLocaleString()} MXN</p>
            </div>
            <DollarSign className="w-8 h-8 text-[#E31837]" />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Efectivo</p>
              <p className="text-3xl font-bold text-green-400" style={{ fontFamily: 'Barlow Condensed' }}>${totalCash.toLocaleString()} MXN</p>
            </div>
            <Banknote className="w-8 h-8 text-green-400" />
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-zinc-500 mb-2">Transferencias</p>
              <p className="text-3xl font-bold text-blue-400" style={{ fontFamily: 'Barlow Condensed' }}>${totalTransfers.toLocaleString()} MXN</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-400" />
          </CardContent>
        </Card>
      </div>

      {/* Pending Services */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader className="border-b border-zinc-800">
          <CardTitle className="text-xl font-bold text-white uppercase flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
            <Receipt className="w-5 h-5 text-[#E31837]" />
            Pendientes de Cobro
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {services.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-zinc-400">No hay cobros pendientes</p>
              <p className="text-zinc-600 text-sm mt-2">Los servicios aparecerán aquí cuando se creen desde Producción</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-sm hover:bg-zinc-800/50 transition-all" data-testid={`pending-service-${service.id}`}>
                  <div>
                    <p className="text-white font-bold text-lg" style={{ fontFamily: 'Barlow Condensed' }}>{service.vehicle_plate}</p>
                    <p className="text-zinc-400 text-sm">{service.client_name} - {service.vehicle_model}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>${service.estimated_cost?.toLocaleString() || 0} MXN</p>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-500/50 text-xs">Pendiente</Badge>
                    </div>
                    <Button onClick={() => openPayDialog(service)} className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase" data-testid={`pay-btn-${service.id}`}>
                      <Wallet className="w-4 h-4 mr-2" />
                      Cobrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              Últimos Cobros
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {payments.slice(0, 10).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-white text-sm">{new Date(payment.created_at).toLocaleDateString('es-MX')}</p>
                    <p className="text-zinc-500 text-xs">
                      {payment.transfer_amount > 0 && payment.cash_amount > 0 ? "Mixto" : 
                       payment.transfer_amount > 0 ? "Transferencia" : "Efectivo"}
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>${payment.total_amount.toLocaleString()} MXN</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Weekly Cuts History */}
      {weeklyCuts.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
              Historial de Cortes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {weeklyCuts.slice(0, 5).map((cut) => (
              <div key={cut.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-sm">
                <div>
                  <p className="text-white">{cut.start_date} - {cut.end_date}</p>
                  <p className="text-zinc-500 text-sm">{cut.total_services} servicios</p>
                </div>
                <p className="text-2xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>${cut.total_revenue.toLocaleString()} MXN</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ============ MODAL CAJA ============ */}
      <Dialog open={payDialogOpen} onOpenChange={setPayDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white uppercase flex items-center gap-2" style={{ fontFamily: 'Barlow Condensed' }}>
              <Calculator className="w-6 h-6 text-[#E31837]" />
              CAJA - COBRO
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Info del servicio */}
            {selectedService && (
              <div className="p-4 bg-zinc-800/50 rounded-sm border border-zinc-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>{selectedService.vehicle_plate}</p>
                    <p className="text-zinc-400">{selectedService.client_name}</p>
                    <p className="text-zinc-500 text-sm">{selectedService.vehicle_model}</p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendiente</Badge>
                </div>
              </div>
            )}

            {/* Total del Servicio */}
            <div>
              <Label className="text-zinc-400 text-xs uppercase mb-2 block">Total del Servicio</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-lg">$</span>
                <Input 
                  type="number" 
                  value={total} 
                  onChange={(e) => setTotal(e.target.value)} 
                  className="bg-zinc-950 border-zinc-800 text-white pl-8 pr-16 text-2xl h-14" 
                  style={{ fontFamily: 'Barlow Condensed' }}
                  data-testid="total-input"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">MXN</span>
              </div>
            </div>

            {/* Código Promocional */}
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-sm">
              <Label className="text-purple-400 text-xs uppercase flex items-center gap-1 mb-2">
                <Tag className="w-3 h-3" /> Código Promoción (Opcional)
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={promoCode} 
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())} 
                  placeholder="Ej: VENTO10" 
                  disabled={!!promoApplied} 
                  className="bg-zinc-950 border-zinc-700 text-white uppercase"
                  data-testid="promo-input"
                />
                {promoApplied ? (
                  <Button onClick={() => { setPromoApplied(null); setPromoCode(""); }} variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/20">Quitar</Button>
                ) : (
                  <Button onClick={applyPromo} className="bg-purple-600 hover:bg-purple-700 text-white">Aplicar</Button>
                )}
              </div>
              {promoApplied && (
                <p className="text-green-400 text-sm mt-2">✓ {promoApplied.description} (-${descuento.toFixed(2)} MXN)</p>
              )}
            </div>

            {/* Total Final */}
            <div className="p-4 bg-[#E31837]/10 border border-[#E31837]/30 rounded-sm text-center">
              <p className="text-zinc-400 text-xs uppercase mb-1">Total a Cobrar</p>
              <p className="text-4xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }} data-testid="total-final">${totalFinal.toFixed(2)} MXN</p>
            </div>

            {/* Método de Pago */}
            <div>
              <Label className="text-zinc-400 text-xs uppercase mb-2 block">Método de Pago</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => setMetodoPago("efectivo")} 
                  variant="outline" 
                  className={cn("h-12 flex-col gap-1", metodoPago === "efectivo" ? "bg-green-500/20 border-green-500 text-green-400" : "border-zinc-700 text-zinc-400")}
                  data-testid="btn-efectivo"
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-xs">Efectivo</span>
                </Button>
                <Button 
                  onClick={() => setMetodoPago("transferencia")} 
                  variant="outline" 
                  className={cn("h-12 flex-col gap-1", metodoPago === "transferencia" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-zinc-700 text-zinc-400")}
                  data-testid="btn-transferencia"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Transfer</span>
                </Button>
                <Button 
                  onClick={() => setMetodoPago("mixto")} 
                  variant="outline" 
                  className={cn("h-12 flex-col gap-1", metodoPago === "mixto" ? "bg-purple-500/20 border-purple-500 text-purple-400" : "border-zinc-700 text-zinc-400")}
                  data-testid="btn-mixto"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">Mixto</span>
                </Button>
              </div>
            </div>

            {/* ========== EFECTIVO ========== */}
            {metodoPago === "efectivo" && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-sm space-y-3">
                <Label className="text-green-400 text-xs uppercase">¿Con cuánto paga el cliente?</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <Input 
                    type="number" 
                    value={efectivoRecibido} 
                    onChange={(e) => setEfectivoRecibido(e.target.value)} 
                    placeholder="0.00"
                    className="bg-zinc-950 border-zinc-700 text-white pl-8 text-xl h-12" 
                    style={{ fontFamily: 'Barlow Condensed' }}
                    data-testid="efectivo-input"
                  />
                </div>
                {efectivoNum > 0 && efectivoNum >= totalFinal && (
                  <div className="p-4 bg-green-600 rounded-sm text-center animate-pulse">
                    <p className="text-green-100 text-xs uppercase">Cambio a entregar</p>
                    <p className="text-3xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>${cambio.toFixed(2)} MXN</p>
                  </div>
                )}
                {efectivoNum > 0 && efectivoNum < totalFinal && (
                  <p className="text-red-400 text-sm">Faltan ${(totalFinal - efectivoNum).toFixed(2)} MXN</p>
                )}
              </div>
            )}

            {/* ========== TRANSFERENCIA ========== */}
            {metodoPago === "transferencia" && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-sm space-y-3">
                <Label className="text-blue-400 text-xs uppercase">Referencia de Transferencia</Label>
                <Input 
                  value={referenciaTransfer} 
                  onChange={(e) => setReferenciaTransfer(e.target.value)} 
                  placeholder="No. de operación o referencia"
                  className="bg-zinc-950 border-zinc-700 text-white"
                  data-testid="referencia-input"
                />
                {referenciaTransfer.trim() && (
                  <div className="p-3 bg-blue-600/20 rounded-sm text-center">
                    <p className="text-blue-300 text-sm">✓ Pago por transferencia: ${totalFinal.toFixed(2)} MXN</p>
                  </div>
                )}
              </div>
            )}

            {/* ========== MIXTO ========== */}
            {metodoPago === "mixto" && (
              <div className="space-y-3">
                {/* Transferencia */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-sm space-y-2">
                  <Label className="text-blue-400 text-xs uppercase">1. Monto de Transferencia</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <Input 
                      type="number" 
                      value={montoTransferencia} 
                      onChange={(e) => setMontoTransferencia(e.target.value)} 
                      placeholder="0.00"
                      className="bg-zinc-950 border-zinc-700 text-white pl-8 text-lg" 
                      data-testid="transfer-amount-input"
                    />
                  </div>
                  <Input 
                    value={referenciaTransfer} 
                    onChange={(e) => setReferenciaTransfer(e.target.value)} 
                    placeholder="Referencia de transferencia"
                    className="bg-zinc-950 border-zinc-700 text-white"
                    data-testid="transfer-ref-input"
                  />
                </div>

                {/* Indicador de restante */}
                {transferNum > 0 && (
                  <div className="flex items-center justify-center gap-2 text-zinc-400">
                    <ArrowRight className="w-4 h-4" />
                    <span>Restante en efectivo: <span className="text-white font-bold">${restanteEfectivo.toFixed(2)} MXN</span></span>
                  </div>
                )}

                {/* Efectivo */}
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-sm space-y-2">
                  <Label className="text-green-400 text-xs uppercase">2. Efectivo Recibido</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <Input 
                      type="number" 
                      value={efectivoRecibido} 
                      onChange={(e) => setEfectivoRecibido(e.target.value)} 
                      placeholder="0.00"
                      className="bg-zinc-950 border-zinc-700 text-white pl-8 text-lg" 
                      data-testid="efectivo-mixto-input"
                    />
                  </div>
                  {efectivoNum > 0 && efectivoNum >= restanteEfectivo && cambio > 0 && (
                    <div className="p-3 bg-green-600 rounded-sm text-center">
                      <p className="text-green-100 text-xs uppercase">Cambio</p>
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>${cambio.toFixed(2)} MXN</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botón Confirmar */}
            <Button 
              onClick={handlePayment} 
              disabled={totalFinal <= 0} 
              className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase h-14 text-lg"
              data-testid="confirm-payment-btn"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {cambio > 0 ? `Cobrar - Dar $${cambio.toFixed(2)} de cambio` : "Confirmar Cobro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
