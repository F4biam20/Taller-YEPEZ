import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import emailjs from "@emailjs/browser";
import {
  FileText, Download, Mail, Sparkles, AlertCircle,
  CheckCircle, ChevronDown, ChevronUp, Eye, Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";

const EMAILJS_SERVICE_ID  = "service_5vom38o";
const EMAILJS_TEMPLATE_ID = "template_86387s7";
const EMAILJS_PUBLIC_KEY  = "haQ6zpY-s7oKu4kdB";

// Generador de resumen automático (sin API externa)

export default function Invoices() {
  const { API, getAuthHeaders } = useAuth();
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null); // servicio seleccionado para factura
  const [payments, setPayments]     = useState([]);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending]       = useState(false);
  const [invoice, setInvoice]       = useState({
    summary: "",
    final_price: "",
    client_email: ""
  });

  useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [svcRes, payRes] = await Promise.all([
        axios.get(`${API}/services`, getAuthHeaders()),
        axios.get(`${API}/payments`, getAuthHeaders())
      ]);
      // Solo servicios listos
      const listos = svcRes.data.filter(s => s.status === "listo");
      setServices(listos);
      setPayments(payRes.data);
    } catch {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const getPayment = (serviceId) =>
    payments.find(p => p.service_id === serviceId && p.payment_complete);

  const openInvoice = (service) => {
    const payment = getPayment(service.id);
    setSelected(service);
    setInvoice({
      summary: "",
      final_price: payment?.total_amount?.toString() || service.estimated_cost?.toString() || "",
      client_email: service.client_email || ""
    });
  };

  // Generar resumen automático sin API externa
  const generateWithAI = () => {
    if (!selected) return;
    setGenerating(true);

    try {
      const notes = selected.mechanic_notes || "";
      const diagnosis = selected.diagnosis || "";

      // Limpiar notas — quitar timestamps y unir
      const cleanNotes = notes
        .split("\n")
        .filter(Boolean)
        .map(n => n.replace(/\[\d{1,2}\/\d{1,2}\/\d{4},?\s*\d{1,2}:\d{2}.*?\]\s*/g, "").trim())
        .filter(n => n.length > 3)
        .join(". ");

      // Detectar tipo de trabajo por palabras clave
      const texto = (cleanNotes + " " + diagnosis).toLowerCase();
      const trabajos = [];

      if (texto.includes("freno") || texto.includes("balata") || texto.includes("disco"))
        trabajos.push("revisión y mantenimiento del sistema de frenos");
      if (texto.includes("aceite") || texto.includes("lubric"))
        trabajos.push("cambio de aceite y lubricación general");
      if (texto.includes("eléctric") || texto.includes("batería") || texto.includes("luz"))
        trabajos.push("diagnóstico y reparación del sistema eléctrico");
      if (texto.includes("motor") || texto.includes("encendido") || texto.includes("bujía"))
        trabajos.push("revisión y ajuste del motor");
      if (texto.includes("suspen") || texto.includes("amortiguad"))
        trabajos.push("revisión del sistema de suspensión");
      if (texto.includes("llanta") || texto.includes("neumático") || texto.includes("rueda"))
        trabajos.push("revisión y servicio de llantas");
      if (texto.includes("afinac") || texto.includes("servicio mayor") || texto.includes("servicio menor"))
        trabajos.push("servicio de afinación y mantenimiento preventivo");
      if (texto.includes("cadena") || texto.includes("transmisión"))
        trabajos.push("revisión y ajuste de cadena y transmisión");

      // Construir resumen profesional
      let resumen = "";

      if (trabajos.length > 0) {
        const listaTrabajos = trabajos.length === 1
          ? trabajos[0]
          : trabajos.slice(0, -1).join(", ") + " y " + trabajos[trabajos.length - 1];
        resumen = `Se realizó ${listaTrabajos} en el vehículo ${selected.vehicle_plate} (${selected.vehicle_model}). `;
      } else {
        resumen = `Se realizó servicio general en el vehículo ${selected.vehicle_plate} (${selected.vehicle_model}). `;
      }

      // Agregar detalle de las notas si hay
      if (cleanNotes) {
        resumen += `Trabajo realizado: ${cleanNotes}. `;
      }

      resumen += `El vehículo fue revisado por nuestro técnico certificado y entregado en óptimas condiciones de funcionamiento. Agradecemos su preferencia por YEPEZ CONTROLS.`;

      setInvoice(prev => ({ ...prev, summary: resumen }));
      toast.success("✅ Resumen generado automáticamente — puedes editarlo si necesitas");
    } catch {
      toast.error("Error al generar resumen");
    } finally {
      setGenerating(false);
    }
  };

  // Generar PDF
  const generatePDF = (service, invoiceData, forDownload = true) => {
    const doc = new jsPDF();
    const payment = getPayment(service.id);

    // Header rojo
    doc.setFillColor(227, 24, 55);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("YEPEZ CONTROLS", 14, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Centro de Servicio Autorizado VENTO", 14, 27);

    // Folio y fecha
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(`Folio: YC-${service.id.slice(-6).toUpperCase()}`, 140, 18);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-MX")}`, 140, 27);

    // Datos del cliente
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 14, 50);
    doc.setDrawColor(227, 24, 55);
    doc.line(14, 52, 196, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Nombre: ${service.client_name}`, 14, 60);
    doc.text(`Correo: ${service.client_email || "No registrado"}`, 14, 68);
    doc.text(`Teléfono: ${service.client_phone || "No registrado"}`, 14, 76);

    // Datos del vehículo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DATOS DEL VEHÍCULO", 14, 92);
    doc.line(14, 94, 196, 94);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Placa: ${service.vehicle_plate}`, 14, 102);
    doc.text(`Modelo: ${service.vehicle_model}`, 14, 110);
    doc.text(`Mecánico: ${service.mechanic_name || "No asignado"}`, 14, 118);

    // Descripción del servicio
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("DESCRIPCIÓN DEL SERVICIO", 14, 134);
    doc.line(14, 136, 196, 136);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(
      invoiceData.summary || service.mechanic_notes || "Servicio realizado correctamente.",
      182
    );
    doc.text(summaryLines, 14, 144);

    // Notas del mecánico (historial)
    let yPos = 144 + summaryLines.length * 6 + 10;
    if (service.mechanic_notes) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("HISTORIAL DE TRABAJO", 14, yPos);
      doc.line(14, yPos + 2, 196, yPos + 2);
      yPos += 10;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const histLines = doc.splitTextToSize(service.mechanic_notes, 182);
      doc.text(histLines, 14, yPos);
      yPos += histLines.length * 5 + 10;
    }

    // Total
    doc.setTextColor(30, 30, 30);
    doc.setFillColor(245, 245, 245);
    doc.rect(110, yPos, 86, 25, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL A PAGAR:", 114, yPos + 10);
    doc.setFontSize(16);
    doc.setTextColor(227, 24, 55);
    doc.text(`$${Number(invoiceData.final_price || 0).toLocaleString("es-MX")} MXN`, 114, yPos + 20);

    // Método de pago
    if (payment) {
      doc.setTextColor(80, 80, 80);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Efectivo: $${payment.cash_amount.toLocaleString("es-MX")} | Transferencia: $${payment.transfer_amount.toLocaleString("es-MX")}`, 14, yPos + 15);
      doc.text(`Estado: ${payment.payment_complete ? "PAGADO ✓" : "PENDIENTE"}`, 14, yPos + 22);
    }

    // Footer
    doc.setFillColor(227, 24, 55);
    doc.rect(0, 280, 210, 17, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Villahermosa, Tabasco | Proyecto de Titulación UJAT — Ingeniería en Sistemas", 14, 290);
    doc.text("© 2026 YEPEZ CONTROLS — Todos los derechos reservados", 14, 296);

    if (forDownload) {
      doc.save(`Factura_${service.vehicle_plate}_${service.id.slice(-6)}.pdf`);
    }
    return doc;
  };

  // Enviar PDF por correo
  const sendByEmail = async () => {
    if (!invoice.client_email) {
      toast.error("Agrega el correo del cliente para enviar la factura");
      return;
    }
    if (!invoice.summary) {
      toast.error("Genera o escribe el resumen del servicio antes de enviar");
      return;
    }

    setSending(true);
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: invoice.client_email,
        name: selected.client_name,
        code: `Tu factura por el servicio de tu ${selected.vehicle_model} (${selected.vehicle_plate}) está lista.\n\n${invoice.summary}\n\nTotal: $${Number(invoice.final_price).toLocaleString("es-MX")} MXN\n\nGracias por confiar en YEPEZ CONTROLS.`
      });

      // También descargar el PDF
      generatePDF(selected, invoice);
      toast.success("✅ Factura enviada al correo del cliente y descargada");
      setSelected(null);
    } catch {
      toast.error("Error al enviar el correo");
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
          Facturas
        </h1>
        <p className="text-zinc-500 mt-1">Servicios completados — revisa, edita y envía la factura al cliente</p>
      </div>

      {/* Lista de servicios listos */}
      {!selected && (
        <>
          {services.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400">No hay servicios completados aún</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {services.map((s) => {
                const payment = getPayment(s.id);
                return (
                  <Card key={s.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-white font-bold text-xl uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                              {s.vehicle_plate}
                            </span>
                            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-xs uppercase">
                              Listo
                            </Badge>
                            {payment && (
                              <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs uppercase">
                                Pagado
                              </Badge>
                            )}
                          </div>
                          <p className="text-zinc-400 text-sm">{s.vehicle_model} — {s.client_name}</p>
                          <p className="text-zinc-500 text-xs mt-1">{s.client_email || "Sin correo registrado"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-2">
                            <p className="text-white font-bold">${(payment?.total_amount || s.estimated_cost || 0).toLocaleString("es-MX")} MXN</p>
                          </div>
                          <Button onClick={() => openInvoice(s)}
                            className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase text-sm h-9">
                            <Eye className="w-4 h-4 mr-1" /> Ver Factura
                          </Button>
                          <Button onClick={() => generatePDF(s, { summary: s.mechanic_notes, final_price: payment?.total_amount || s.estimated_cost })}
                            variant="outline" className="border-zinc-700 text-zinc-400 hover:bg-zinc-800 h-9">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Vista previa de factura */}
      {selected && (
        <div className="space-y-4">
          {/* Aviso admin */}
          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-sm">
              <strong>REVISA LA FACTURA ANTES DE ENVIAR.</strong> Verifica nombres, descripción del servicio y precio. 
              Puedes usar el botón de IA para generar un resumen profesional basado en las notas del mecánico.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Editor */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-bold text-white uppercase" style={{ fontFamily: 'Barlow Condensed' }}>
                  <Edit3 className="w-5 h-5 inline mr-2" />Editar Factura
                </h2>

                {/* Datos del cliente */}
                <div className="p-4 bg-zinc-800/30 rounded-sm space-y-2">
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Datos del cliente</p>
                  <p className="text-white text-sm"><span className="text-zinc-500">Nombre:</span> {selected.client_name}</p>
                  <p className="text-white text-sm"><span className="text-zinc-500">Placa:</span> {selected.vehicle_plate} — {selected.vehicle_model}</p>
                  <p className="text-white text-sm"><span className="text-zinc-500">Mecánico:</span> {selected.mechanic_name || "No asignado"}</p>
                </div>

                {/* Notas del mecánico para referencia */}
                {selected.mechanic_notes && (
                  <div className="p-4 bg-zinc-800/30 rounded-sm">
                    <p className="text-zinc-400 text-xs uppercase tracking-wider mb-2">Notas del mecánico (referencia)</p>
                    <p className="text-zinc-300 text-xs whitespace-pre-line">{selected.mechanic_notes}</p>
                  </div>
                )}

                {/* Resumen editable */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-400 text-xs uppercase tracking-wider">Resumen del servicio *</label>
                    <Button onClick={generateWithAI} disabled={generating} size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7 px-3">
                      {generating
                        ? <span className="flex items-center gap-1"><span className="animate-spin rounded-full h-3 w-3 border-t border-white" />Generando...</span>
                        : <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" />Generar resumen</span>
                      }
                    </Button>
                  </div>
                  <Textarea
                    value={invoice.summary}
                    onChange={(e) => setInvoice(prev => ({ ...prev, summary: e.target.value }))}
                    placeholder="Escribe o genera con IA el resumen del servicio para el cliente..."
                    className="bg-zinc-950 border-zinc-700 text-white min-h-[120px] resize-none"
                  />
                </div>

                {/* Precio */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs uppercase tracking-wider">Precio final (MXN) *</label>
                  <Input
                    type="number"
                    value={invoice.final_price}
                    onChange={(e) => setInvoice(prev => ({ ...prev, final_price: e.target.value }))}
                    placeholder="0.00"
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>

                {/* Correo */}
                <div className="space-y-2">
                  <label className="text-zinc-400 text-xs uppercase tracking-wider">Correo del cliente *</label>
                  <Input
                    type="email"
                    value={invoice.client_email}
                    onChange={(e) => setInvoice(prev => ({ ...prev, client_email: e.target.value }))}
                    placeholder="correo@cliente.com"
                    className="bg-zinc-950 border-zinc-700 text-white"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-2">
                  <Button onClick={sendByEmail} disabled={sending}
                    className="flex-1 bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase h-11">
                    {sending
                      ? <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />Enviando...</span>
                      : <span className="flex items-center gap-2"><Mail className="w-4 h-4" />Enviar al cliente</span>
                    }
                  </Button>
                  <Button onClick={() => generatePDF(selected, invoice)}
                    variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 h-11 px-4">
                    <Download className="w-4 h-4 mr-2" />PDF
                  </Button>
                </div>

                <button onClick={() => setSelected(null)}
                  className="w-full text-zinc-500 hover:text-zinc-300 text-sm transition-colors text-center">
                  ← Volver a la lista
                </button>
              </CardContent>
            </Card>

            {/* Vista previa visual */}
            <Card className="bg-white border-zinc-300">
              <CardContent className="p-0 overflow-hidden rounded-sm">
                {/* Header */}
                <div className="bg-[#E31837] p-6">
                  <h2 className="text-white font-bold text-2xl uppercase">YEPEZ CONTROLS</h2>
                  <p className="text-red-200 text-sm">Centro de Servicio Autorizado VENTO</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-red-200 text-xs">Folio: YC-{selected.id.slice(-6).toUpperCase()}</span>
                    <span className="text-red-200 text-xs">{new Date().toLocaleDateString("es-MX")}</span>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Cliente */}
                  <div>
                    <p className="text-[#E31837] font-bold text-xs uppercase tracking-wider mb-2">Datos del cliente</p>
                    <p className="text-gray-800 text-sm"><strong>Nombre:</strong> {selected.client_name}</p>
                    <p className="text-gray-800 text-sm"><strong>Placa:</strong> {selected.vehicle_plate} — {selected.vehicle_model}</p>
                    <p className="text-gray-600 text-sm"><strong>Correo:</strong> {invoice.client_email || "—"}</p>
                  </div>

                  {/* Servicio */}
                  <div>
                    <p className="text-[#E31837] font-bold text-xs uppercase tracking-wider mb-2">Descripción del servicio</p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {invoice.summary || <span className="text-gray-400 italic">Escribe o genera el resumen con IA...</span>}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 rounded p-4 flex items-center justify-between">
                    <span className="text-gray-600 font-bold uppercase text-sm">Total a pagar</span>
                    <span className="text-[#E31837] font-bold text-2xl">
                      ${Number(invoice.final_price || 0).toLocaleString("es-MX")} MXN
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="bg-[#E31837] rounded p-3 text-center">
                    <p className="text-white text-xs">Villahermosa, Tabasco | © 2026 YEPEZ CONTROLS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
