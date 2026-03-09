# YEPEZ CONTROLS - PRD v3.1

## Proyecto de Titulación UJAT - Ingeniería en Sistemas
### Última Actualización: Diciembre 2025

---

## Estado del Proyecto: ✅ MVP COMPLETO - LISTO PARA PRODUCCIÓN

### Cambios Recientes (Esta Sesión)
1. ✅ **Datos de prueba eliminados** - Sistema limpio para datos reales
2. ✅ **Landing Page mejorada** - Imágenes de fondo dinámicas e interactivas
3. ✅ **Caja arreglada** - Flujo mejorado con soporte para pago Mixto (Efectivo + Transferencia)

---

## Funcionalidades Implementadas

#### 1. Landing Page Pública
- ✅ Imágenes de fondo dinámicas con transición automática
- ✅ Servicios con efecto hover e imágenes
- ✅ Sección "Por qué elegirnos" con parallax
- ✅ Rastreo de vehículo por placa
- ✅ Sin registro de clientes

#### 2. Sistema de Caja (MEJORADO)
- ✅ **3 métodos de pago**: Efectivo, Transferencia, Mixto
- ✅ **Pago Mixto**: Transferencia parcial + Efectivo restante
- ✅ Cálculo automático de cambio
- ✅ Códigos promocionales (VENTO10, VENTO20, UJAT2026, etc.)
- ✅ Exportación PDF y Excel
- ✅ Mensaje claro cuando no hay cobros pendientes

#### 3. Dashboard Admin
- ✅ Gráficas interactivas con Recharts
- ✅ KPIs en tiempo real

#### 4. Producción/Servicios
- ✅ Flujo: Cita → Servicio → Pago → Asignación
- ✅ WhatsApp automático a mecánicos

#### 5. Inventario
- ✅ CRUD completo con alertas stock bajo
- ✅ Exportación PDF/Excel

---

## Credenciales de Acceso

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@yepezcontrols.com | Admin2026! |
| PIN Corte | - | UJAT2026 |

---

## Stack Tecnológico

```
Frontend: React 19 + Tailwind CSS + shadcn/ui + Recharts
Backend: FastAPI + Motor (MongoDB async)
Database: MongoDB
Auth: JWT + bcrypt
Exports: jspdf + xlsx
WhatsApp: CallMeBot API
```

---

## Flujo de Cobro (3 Métodos)

### Efectivo
1. Ingresar total → 2. Cliente paga → 3. Sistema calcula cambio → 4. Confirmar

### Transferencia
1. Ingresar total → 2. Ingresar referencia → 3. Confirmar

### Mixto (Efectivo + Transferencia)
1. Ingresar total
2. Ingresar monto de transferencia + referencia
3. Sistema calcula restante en efectivo
4. Cliente paga efectivo
5. Sistema calcula cambio si aplica
6. Confirmar

---

## Próximos Pasos (Para el Usuario)

1. **Crear mecánicos** desde Admin → Mecánicos
2. **Crear citas** desde Admin → Citas
3. **Convertir citas a servicios** desde Admin → Producción
4. **Cobrar servicios** desde Admin → Finanzas (Caja)

---

## Pendientes Futuros (Backlog)

### P1 - Alta Prioridad
- Notificaciones a clientes cuando servicio termine
- Links únicos por servicio

### P2 - Media Prioridad
- Historial de servicios por cliente
- App móvil para mecánicos

### P3 - Baja Prioridad
- Integración contable
- Multi-sucursal
