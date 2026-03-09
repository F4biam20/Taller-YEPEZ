import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Package, Plus, AlertTriangle, Edit, Trash2, Minus, FileSpreadsheet, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  "Aceites",
  "Filtros",
  "Frenos",
  "Suspensión",
  "Eléctrico",
  "Transmisión",
  "Motor",
  "Carrocería",
  "Llantas",
  "Accesorios"
];

export default function Inventory() {
  const { API, getAuthHeaders } = useAuth();
  const [items, setItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    quantity: "",
    min_stock: "",
    unit_price: "",
    supplier: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, lowStockRes] = await Promise.all([
        axios.get(`${API}/inventory`, getAuthHeaders()),
        axios.get(`${API}/inventory/low-stock`, getAuthHeaders())
      ]);
      setItems(itemsRes.data);
      setLowStockItems(lowStockRes.data);
    } catch (error) {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportToExcel = async () => {
    try {
      const response = await axios.get(`${API}/reports/inventory/export`, getAuthHeaders());
      const data = response.data;
      
      const wsData = [
        ["INVENTARIO - YEPEZ CONTROLS"],
        [`Generado: ${new Date(data.generated_at).toLocaleString('es-MX')}`],
        [],
        ["RESUMEN"],
        ["Total Artículos", data.summary.total_items],
        ["Total Unidades", data.summary.total_units],
        ["Valor Total", `$${data.summary.total_value.toLocaleString()}`],
        ["Stock Bajo", data.summary.low_stock_count],
        [],
        ["DETALLE"],
        ["Nombre", "SKU", "Categoría", "Cantidad", "Mínimo", "Precio", "Valor Total", "Proveedor"]
      ];
      
      data.items.forEach(i => {
        wsData.push([i.name, i.sku, i.category, i.quantity, i.min_stock, `$${i.unit_price}`, `$${i.quantity * i.unit_price}`, i.supplier || "N/A"]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");
      
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `inventario_yepez_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Inventario exportado a Excel");
    } catch (error) {
      toast.error("Error al exportar");
    }
  };

  const exportToPDF = async () => {
    try {
      const response = await axios.get(`${API}/reports/inventory/export`, getAuthHeaders());
      const data = response.data;
      
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(227, 24, 55);
      doc.text("YEPEZ CONTROLS", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Reporte de Inventario", 105, 28, { align: "center" });
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date(data.generated_at).toLocaleString('es-MX')}`, 105, 35, { align: "center" });
      
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Total: ${data.summary.total_items} artículos | ${data.summary.total_units} unidades | Valor: $${data.summary.total_value.toLocaleString()}`, 14, 50);
      
      if (data.items.length > 0) {
        doc.autoTable({
          startY: 60,
          head: [["Nombre", "SKU", "Categoría", "Cant.", "Precio", "Valor"]],
          body: data.items.map(i => [i.name, i.sku, i.category, i.quantity, `$${i.unit_price}`, `$${i.quantity * i.unit_price}`]),
          theme: 'striped',
          headStyles: { fillColor: [227, 24, 55] }
        });
      }
      
      doc.save(`inventario_yepez_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Inventario exportado a PDF");
    } catch (error) {
      toast.error("Error al exportar");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
        unit_price: parseFloat(formData.unit_price)
      };

      if (editItem) {
        await axios.put(`${API}/inventory/${editItem.id}`, payload, getAuthHeaders());
        toast.success("Artículo actualizado");
      } else {
        await axios.post(`${API}/inventory`, payload, getAuthHeaders());
        toast.success("Artículo creado");
      }
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al guardar");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este artículo?")) return;
    try {
      await axios.delete(`${API}/inventory/${id}`, getAuthHeaders());
      toast.success("Artículo eliminado");
      fetchData();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleAdjust = async (id, adjustment) => {
    try {
      await axios.put(`${API}/inventory/${id}/adjust?adjustment=${adjustment}`, {}, getAuthHeaders());
      toast.success("Inventario ajustado");
      fetchData();
    } catch (error) {
      toast.error("Error al ajustar inventario");
    }
  };

  const openEditDialog = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity.toString(),
      min_stock: item.min_stock.toString(),
      unit_price: item.unit_price.toString(),
      supplier: item.supplier || ""
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditItem(null);
    setFormData({
      name: "",
      sku: "",
      category: "",
      quantity: "",
      min_stock: "",
      unit_price: "",
      supplier: ""
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#E31837]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="inventory-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
            Inventario
          </h1>
          <p className="text-zinc-500 mt-1">Gestión de refacciones y stock</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button
              data-testid="new-item-btn"
              className="bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Artículo
            </Button>
          </DialogTrigger>

        <Button onClick={exportToExcel} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
          Excel
        </Button>
        <Button onClick={exportToPDF} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
          <FileText className="w-4 h-4 mr-2 text-red-500" />
          PDF
        </Button>
          <DialogContent className="bg-zinc-900 border-zinc-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white uppercase tracking-tight" style={{ fontFamily: 'Barlow Condensed' }}>
                {editItem ? "Editar Artículo" : "Nuevo Artículo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Nombre*</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    data-testid="item-name"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">SKU*</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    required
                    disabled={!!editItem}
                    data-testid="item-sku"
                    className="bg-zinc-950 border-zinc-800 text-white uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Categoría*</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger data-testid="item-category" className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="text-white hover:bg-zinc-800">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Cantidad*</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                    min="0"
                    data-testid="item-quantity"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Stock Mínimo*</Label>
                  <Input
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    required
                    min="0"
                    data-testid="item-min-stock"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Precio Unitario*</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                    required
                    min="0"
                    data-testid="item-price"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs uppercase tracking-widest">Proveedor</Label>
                  <Input
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    data-testid="item-supplier"
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-testid="item-submit-btn"
                className="w-full bg-[#E31837] hover:bg-[#C4122C] text-white font-bold uppercase tracking-wider"
              >
                {editItem ? "Actualizar" : "Crear"} Artículo
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <p className="text-red-400 font-bold uppercase tracking-wider" style={{ fontFamily: 'Barlow Condensed' }}>
                  ¡Alerta de Stock Bajo!
                </p>
                <p className="text-red-300/70 text-sm">
                  {lowStockItems.length} artículo(s) por debajo del mínimo: {lowStockItems.map(i => i.name).join(", ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              {items.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Artículos</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              {items.reduce((acc, i) => acc + i.quantity, 0)}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Unidades</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#E31837]" style={{ fontFamily: 'Barlow Condensed' }}>
              {lowStockItems.length}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Stock Bajo</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Barlow Condensed' }}>
              ${items.reduce((acc, i) => acc + (i.quantity * i.unit_price), 0).toLocaleString()} MXN
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Valor Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left p-4 text-xs font-bold tracking-widest uppercase text-zinc-500">Artículo</th>
                  <th className="text-left p-4 text-xs font-bold tracking-widest uppercase text-zinc-500">SKU</th>
                  <th className="text-left p-4 text-xs font-bold tracking-widest uppercase text-zinc-500">Categoría</th>
                  <th className="text-center p-4 text-xs font-bold tracking-widest uppercase text-zinc-500">Stock</th>
                  <th className="text-right p-4 text-xs font-bold tracking-widest uppercase text-zinc-500">Precio</th>
                  <th className="text-right p-4 text-xs font-bold tracking-widest uppercase text-zinc-500">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-zinc-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                      No hay artículos en el inventario
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30" data-testid={`inventory-item-${item.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {item.low_stock && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          <span className="text-white font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-400 font-mono text-sm">{item.sku}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="bg-zinc-800/50 text-zinc-400 border-zinc-700">
                          {item.category}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAdjust(item.id, -1)}
                            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className={cn(
                            "font-bold text-lg min-w-[40px]",
                            item.low_stock ? "text-red-400" : "text-white"
                          )} style={{ fontFamily: 'Barlow Condensed' }}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAdjust(item.id, 1)}
                            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-800"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-zinc-600 mt-1">Min: {item.min_stock}</p>
                      </td>
                      <td className="p-4 text-right text-white font-bold" style={{ fontFamily: 'Barlow Condensed' }}>
                        ${item.unit_price.toLocaleString()} MXN
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(item)}
                            className="text-zinc-500 hover:text-white hover:bg-zinc-800"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(item.id)}
                            className="text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
