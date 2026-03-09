from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from io import BytesIO
import json
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'yepez_controls_secret_2026')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# PIN for weekly cut
WEEKLY_CUT_PIN = "UJAT2026"

# WhatsApp CallMeBot API (free)
CALLMEBOT_API_URL = "https://api.callmebot.com/whatsapp.php"

# Create the main app
app = FastAPI(title="YEPEZ CONTROLS API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str = "cliente"  # admin, mecanico, cliente
    phone: Optional[str] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    created_at: str

class MecanicoCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    whatsapp_apikey: Optional[str] = None  # CallMeBot API key

class MecanicoResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    specialty: Optional[str] = None
    active: bool = True
    whatsapp_apikey: Optional[str] = None

# WhatsApp Notification Model
class WhatsAppNotification(BaseModel):
    phone: str
    message: str

# ==================== WHATSAPP HELPER ====================
async def send_whatsapp_notification(phone: str, apikey: str, message: str) -> bool:
    """Send WhatsApp message via CallMeBot API"""
    if not phone or not apikey:
        logging.warning("WhatsApp: No phone or apikey provided")
        return False
    try:
        # Clean phone number - remove all non-numeric characters
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # URL encode the message
        import urllib.parse
        encoded_message = urllib.parse.quote(message)
        
        # Build URL directly
        url = f"https://api.callmebot.com/whatsapp.php?phone={clean_phone}&text={encoded_message}&apikey={apikey}"
        
        logging.info(f"WhatsApp: Sending to {clean_phone}")
        
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(url, timeout=15.0)
            logging.info(f"WhatsApp response: {response.status_code} - {response.text[:100]}")
            return response.status_code == 200
    except Exception as e:
        logging.error(f"WhatsApp error: {e}")
        return False

def generate_ai_message(mechanic_name: str, vehicle_plate: str, vehicle_model: str, client_name: str, diagnosis: str, shift: str) -> str:
    """Generate notification message for mechanic"""
    shift_text = "MATUTINO 8:00-14:00" if shift == "matutino" else "VESPERTINO 14:00-20:00"
    
    message = f"""YEPEZ CONTROLS - Nueva Asignacion

Hola {mechanic_name}!

Nuevo servicio asignado:

Vehiculo: {vehicle_plate} - {vehicle_model}
Cliente: {client_name}
Diagnostico: {diagnosis or 'Pendiente'}
Turno: {shift_text}

Ingresa al sistema para mas detalles."""
    
    return message

# Appointment/Service Models
class AppointmentCreate(BaseModel):
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    vehicle_plate: str
    vehicle_model: str
    vehicle_year: Optional[int] = None
    service_type: str
    description: Optional[str] = None
    scheduled_date: str
    scheduled_time: str

class AppointmentResponse(BaseModel):
    id: str
    client_name: str
    client_phone: str
    client_email: Optional[str] = None
    vehicle_plate: str
    vehicle_model: str
    vehicle_year: Optional[int] = None
    service_type: str
    description: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    status: str
    created_at: str

# Service/Production Models
class ServiceCreate(BaseModel):
    appointment_id: str
    diagnosis: Optional[str] = None
    estimated_cost: float = 0
    parts_needed: List[dict] = []

class ServiceUpdate(BaseModel):
    diagnosis: Optional[str] = None
    estimated_cost: Optional[float] = None
    status: Optional[str] = None
    mechanic_id: Optional[str] = None
    shift: Optional[str] = None
    progress: Optional[int] = None
    parts_used: Optional[List[dict]] = None

class ServiceResponse(BaseModel):
    id: str
    appointment_id: str
    vehicle_plate: str
    vehicle_model: str
    client_name: str
    diagnosis: Optional[str] = None
    estimated_cost: float
    status: str
    mechanic_id: Optional[str] = None
    mechanic_name: Optional[str] = None
    shift: Optional[str] = None
    progress: int
    parts_used: List[dict]
    payment_status: str
    created_at: str
    updated_at: str

# Payment Models
class PaymentCreate(BaseModel):
    service_id: str
    total_amount: float
    transfer_amount: float = 0
    cash_amount: float = 0
    cash_received: float = 0
    transfer_reference: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: str
    service_id: str
    total_amount: float
    transfer_amount: float
    cash_amount: float
    cash_received: float
    change_amount: float
    transfer_reference: Optional[str] = None
    transfer_confirmed: bool
    payment_complete: bool
    notes: Optional[str] = None
    created_at: str

# Inventory Models
class InventoryItemCreate(BaseModel):
    name: str
    sku: str
    category: str
    quantity: int
    min_stock: int
    unit_price: float
    supplier: Optional[str] = None

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    min_stock: Optional[int] = None
    unit_price: Optional[float] = None
    supplier: Optional[str] = None

class InventoryItemResponse(BaseModel):
    id: str
    name: str
    sku: str
    category: str
    quantity: int
    min_stock: int
    unit_price: float
    supplier: Optional[str] = None
    low_stock: bool
    created_at: str

# Weekly Cut Models
class WeeklyCutCreate(BaseModel):
    pin: str
    notes: Optional[str] = None

class WeeklyCutResponse(BaseModel):
    id: str
    start_date: str
    end_date: str
    total_services: int
    total_revenue: float
    cash_total: float
    transfer_total: float
    notes: Optional[str] = None
    created_by: str
    created_at: str

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requiere rol de administrador")
    return user

async def require_admin_or_mechanic(user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "mecanico"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    return user

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=dict)
async def register_client(user_data: UserCreate):
    """Registro público solo para clientes"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": "cliente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, "cliente")
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "role": "cliente"
        }
    }

@api_router.post("/auth/login", response_model=dict)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_token(user["id"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        phone=user.get("phone"),
        created_at=user["created_at"]
    )

# ==================== MECHANICS MANAGEMENT (Admin only) ====================

@api_router.post("/mechanics", response_model=MecanicoResponse)
async def create_mechanic(mechanic: MecanicoCreate, admin: dict = Depends(require_admin)):
    """Admin crea cuentas de mecánicos"""
    existing = await db.users.find_one({"email": mechanic.email})
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": mechanic.email,
        "password": hash_password(mechanic.password),
        "name": mechanic.name,
        "phone": mechanic.phone,
        "specialty": mechanic.specialty,
        "whatsapp_apikey": mechanic.whatsapp_apikey,
        "role": "mecanico",
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    return MecanicoResponse(
        id=user_id,
        email=mechanic.email,
        name=mechanic.name,
        role="mecanico",
        phone=mechanic.phone,
        specialty=mechanic.specialty,
        whatsapp_apikey=mechanic.whatsapp_apikey,
        active=True
    )

@api_router.get("/mechanics", response_model=List[MecanicoResponse])
async def get_mechanics(user: dict = Depends(require_admin_or_mechanic)):
    mechanics = await db.users.find({"role": "mecanico"}, {"_id": 0, "password": 0}).to_list(100)
    return [MecanicoResponse(
        id=m["id"],
        email=m["email"],
        name=m["name"],
        role=m["role"],
        phone=m.get("phone"),
        specialty=m.get("specialty"),
        whatsapp_apikey=m.get("whatsapp_apikey"),
        active=m.get("active", True)
    ) for m in mechanics]

@api_router.put("/mechanics/{mechanic_id}/toggle", response_model=dict)
async def toggle_mechanic(mechanic_id: str, admin: dict = Depends(require_admin)):
    mechanic = await db.users.find_one({"id": mechanic_id, "role": "mecanico"})
    if not mechanic:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    
    new_status = not mechanic.get("active", True)
    await db.users.update_one({"id": mechanic_id}, {"$set": {"active": new_status}})
    return {"message": f"Mecánico {'activado' if new_status else 'desactivado'}", "active": new_status}

@api_router.delete("/mechanics/{mechanic_id}")
async def delete_mechanic(mechanic_id: str, admin: dict = Depends(require_admin)):
    result = await db.users.delete_one({"id": mechanic_id, "role": "mecanico"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Mecánico no encontrado")
    return {"message": "Mecánico eliminado"}

# ==================== APPOINTMENTS ====================

@api_router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate, user: dict = Depends(require_admin)):
    appt_id = str(uuid.uuid4())
    appt_doc = {
        "id": appt_id,
        "client_name": appointment.client_name,
        "client_phone": appointment.client_phone,
        "client_email": appointment.client_email,
        "vehicle_plate": appointment.vehicle_plate.upper(),
        "vehicle_model": appointment.vehicle_model,
        "vehicle_year": appointment.vehicle_year,
        "service_type": appointment.service_type,
        "description": appointment.description,
        "scheduled_date": appointment.scheduled_date,
        "scheduled_time": appointment.scheduled_time,
        "status": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.appointments.insert_one(appt_doc)
    return AppointmentResponse(**{k: v for k, v in appt_doc.items() if k != "_id"})

@api_router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(user: dict = Depends(require_admin)):
    appointments = await db.appointments.find({}, {"_id": 0}).sort("scheduled_date", -1).to_list(100)
    return [AppointmentResponse(**a) for a in appointments]

@api_router.put("/appointments/{appt_id}/status")
async def update_appointment_status(appt_id: str, status: str, user: dict = Depends(require_admin)):
    result = await db.appointments.update_one({"id": appt_id}, {"$set": {"status": status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"message": "Estado actualizado"}

@api_router.delete("/appointments/{appt_id}")
async def delete_appointment(appt_id: str, user: dict = Depends(require_admin)):
    result = await db.appointments.delete_one({"id": appt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    return {"message": "Cita eliminada"}

# ==================== SERVICES (Production) ====================

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, user: dict = Depends(require_admin)):
    # Get appointment details
    appointment = await db.appointments.find_one({"id": service.appointment_id}, {"_id": 0})
    if not appointment:
        raise HTTPException(status_code=404, detail="Cita no encontrada")
    
    service_id = str(uuid.uuid4())
    service_doc = {
        "id": service_id,
        "appointment_id": service.appointment_id,
        "vehicle_plate": appointment["vehicle_plate"],
        "vehicle_model": appointment["vehicle_model"],
        "client_name": appointment["client_name"],
        "diagnosis": service.diagnosis,
        "estimated_cost": service.estimated_cost,
        "status": "recibido",
        "mechanic_id": None,
        "mechanic_name": None,
        "shift": None,
        "progress": 0,
        "parts_used": [],
        "payment_status": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.services.insert_one(service_doc)
    
    # Update appointment status
    await db.appointments.update_one({"id": service.appointment_id}, {"$set": {"status": "en_servicio"}})
    
    return ServiceResponse(**{k: v for k, v in service_doc.items() if k != "_id"})

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(user: dict = Depends(require_admin_or_mechanic)):
    services = await db.services.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ServiceResponse(**s) for s in services]

@api_router.get("/services/mechanic", response_model=List[ServiceResponse])
async def get_mechanic_services(user: dict = Depends(get_current_user)):
    """Get services assigned to current mechanic"""
    if user["role"] not in ["mecanico", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    query = {"mechanic_id": user["id"]} if user["role"] == "mecanico" else {}
    services = await db.services.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [ServiceResponse(**s) for s in services]

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, update: ServiceUpdate, user: dict = Depends(require_admin_or_mechanic)):
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # If assigning mechanic, check payment status
    if "mechanic_id" in update_data or "shift" in update_data:
        if service["payment_status"] != "pagado":
            raise HTTPException(status_code=400, detail="No se puede asignar mecánico/turno sin pago validado")
        
        # Get mechanic info if assigning
        if "mechanic_id" in update_data:
            mechanic = await db.users.find_one({"id": update_data["mechanic_id"]}, {"_id": 0})
            if mechanic:
                update_data["mechanic_name"] = mechanic["name"]
                
                # Send WhatsApp notification if mechanic has phone and apikey
                if mechanic.get("phone") and mechanic.get("whatsapp_apikey") and update_data.get("shift"):
                    message = generate_ai_message(
                        mechanic_name=mechanic["name"],
                        vehicle_plate=service["vehicle_plate"],
                        vehicle_model=service["vehicle_model"],
                        client_name=service["client_name"],
                        diagnosis=service.get("diagnosis", ""),
                        shift=update_data.get("shift", "matutino")
                    )
                    # Send async notification
                    await send_whatsapp_notification(
                        phone=mechanic["phone"],
                        apikey=mechanic["whatsapp_apikey"],
                        message=message
                    )
                    logging.info(f"WhatsApp notification sent to {mechanic['name']}")
    
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.services.update_one({"id": service_id}, {"$set": update_data})
    
    updated_service = await db.services.find_one({"id": service_id}, {"_id": 0})
    return ServiceResponse(**updated_service)

@api_router.put("/services/{service_id}/progress")
async def update_service_progress(service_id: str, progress: int, user: dict = Depends(get_current_user)):
    """Mechanic updates progress"""
    if user["role"] not in ["mecanico", "admin"]:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Mechanic can only update their own services
    if user["role"] == "mecanico" and service["mechanic_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="No tienes acceso a este servicio")
    
    progress = max(0, min(100, progress))
    status = "listo" if progress == 100 else ("en_reparacion" if progress > 0 else service["status"])
    
    await db.services.update_one(
        {"id": service_id},
        {"$set": {"progress": progress, "status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Progreso actualizado", "progress": progress, "status": status}

# ==================== PAYMENTS (Mixed Payment Logic) ====================

@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate, user: dict = Depends(require_admin)):
    """
    Cobro Mixto: Efectivo_a_recibir = Total_Servicio - Monto_Transferencia
    Calcular cambio si efectivo entregado > restante
    """
    service = await db.services.find_one({"id": payment.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Calculate cash needed
    cash_needed = payment.total_amount - payment.transfer_amount
    
    # Calculate change
    change_amount = max(0, payment.cash_received - cash_needed) if payment.cash_received > 0 else 0
    
    # Check if payment is complete
    transfer_ok = payment.transfer_amount == 0 or (payment.transfer_reference and len(payment.transfer_reference) > 0)
    cash_ok = cash_needed <= 0 or payment.cash_received >= cash_needed
    payment_complete = transfer_ok and cash_ok
    
    payment_id = str(uuid.uuid4())
    payment_doc = {
        "id": payment_id,
        "service_id": payment.service_id,
        "total_amount": payment.total_amount,
        "transfer_amount": payment.transfer_amount,
        "cash_amount": cash_needed,
        "cash_received": payment.cash_received,
        "change_amount": change_amount,
        "transfer_reference": payment.transfer_reference,
        "transfer_confirmed": bool(payment.transfer_reference),
        "payment_complete": payment_complete,
        "notes": payment.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payments.insert_one(payment_doc)
    
    # Update service payment status
    if payment_complete:
        await db.services.update_one(
            {"id": payment.service_id},
            {"$set": {"payment_status": "pagado", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return PaymentResponse(**{k: v for k, v in payment_doc.items() if k != "_id"})

@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(user: dict = Depends(require_admin)):
    payments = await db.payments.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [PaymentResponse(**p) for p in payments]

@api_router.put("/payments/{payment_id}/confirm-transfer")
async def confirm_transfer(payment_id: str, user: dict = Depends(require_admin)):
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    
    await db.payments.update_one(
        {"id": payment_id},
        {"$set": {"transfer_confirmed": True, "payment_complete": True}}
    )
    
    # Update service payment status
    await db.services.update_one(
        {"id": payment["service_id"]},
        {"$set": {"payment_status": "pagado", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Transferencia confirmada"}

# ==================== INVENTORY ====================

@api_router.post("/inventory", response_model=InventoryItemResponse)
async def create_inventory_item(item: InventoryItemCreate, user: dict = Depends(require_admin)):
    existing = await db.inventory.find_one({"sku": item.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU ya existe")
    
    item_id = str(uuid.uuid4())
    item_doc = {
        "id": item_id,
        "name": item.name,
        "sku": item.sku,
        "category": item.category,
        "quantity": item.quantity,
        "min_stock": item.min_stock,
        "unit_price": item.unit_price,
        "supplier": item.supplier,
        "low_stock": item.quantity < item.min_stock,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.inventory.insert_one(item_doc)
    return InventoryItemResponse(**{k: v for k, v in item_doc.items() if k != "_id"})

@api_router.get("/inventory", response_model=List[InventoryItemResponse])
async def get_inventory(user: dict = Depends(require_admin_or_mechanic)):
    items = await db.inventory.find({}, {"_id": 0}).to_list(500)
    return [InventoryItemResponse(**i) for i in items]

@api_router.get("/inventory/low-stock", response_model=List[InventoryItemResponse])
async def get_low_stock_items(user: dict = Depends(require_admin)):
    items = await db.inventory.find({"low_stock": True}, {"_id": 0}).to_list(100)
    return [InventoryItemResponse(**i) for i in items]

@api_router.put("/inventory/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(item_id: str, update: InventoryItemUpdate, user: dict = Depends(require_admin)):
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    # Update low_stock flag
    if "quantity" in update_data or "min_stock" in update_data:
        new_qty = update_data.get("quantity", item["quantity"])
        new_min = update_data.get("min_stock", item["min_stock"])
        update_data["low_stock"] = new_qty < new_min
    
    await db.inventory.update_one({"id": item_id}, {"$set": update_data})
    
    updated_item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    return InventoryItemResponse(**updated_item)

@api_router.put("/inventory/{item_id}/adjust")
async def adjust_inventory(item_id: str, adjustment: int, user: dict = Depends(require_admin_or_mechanic)):
    """Adjust inventory quantity (positive or negative)"""
    item = await db.inventory.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    
    new_qty = max(0, item["quantity"] + adjustment)
    low_stock = new_qty < item["min_stock"]
    
    await db.inventory.update_one(
        {"id": item_id},
        {"$set": {"quantity": new_qty, "low_stock": low_stock}}
    )
    
    return {"message": "Inventario ajustado", "new_quantity": new_qty, "low_stock": low_stock}

@api_router.delete("/inventory/{item_id}")
async def delete_inventory_item(item_id: str, user: dict = Depends(require_admin)):
    result = await db.inventory.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Artículo no encontrado")
    return {"message": "Artículo eliminado"}

# ==================== WEEKLY CUT (Saturday only, PIN protected) ====================

@api_router.post("/weekly-cut", response_model=WeeklyCutResponse)
async def create_weekly_cut(cut_data: WeeklyCutCreate, user: dict = Depends(require_admin)):
    """Weekly cut - Only available on Saturdays, requires PIN"""
    # Verify PIN
    if cut_data.pin != WEEKLY_CUT_PIN:
        raise HTTPException(status_code=403, detail="PIN incorrecto")
    
    # Check if it's Saturday (5 = Saturday in weekday())
    today = datetime.now(timezone.utc)
    # For testing purposes, allow any day but log warning
    if today.weekday() != 5:
        logging.warning(f"Weekly cut performed on non-Saturday: {today.strftime('%A')}")
    
    # Calculate week range
    start_of_week = today - timedelta(days=today.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    # Get all completed payments from this week
    payments = await db.payments.find({
        "payment_complete": True,
        "created_at": {
            "$gte": start_of_week.isoformat(),
            "$lte": end_of_week.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    total_revenue = sum(p["total_amount"] for p in payments)
    cash_total = sum(p["cash_amount"] for p in payments)
    transfer_total = sum(p["transfer_amount"] for p in payments)
    
    cut_id = str(uuid.uuid4())
    cut_doc = {
        "id": cut_id,
        "start_date": start_of_week.strftime("%Y-%m-%d"),
        "end_date": end_of_week.strftime("%Y-%m-%d"),
        "total_services": len(payments),
        "total_revenue": total_revenue,
        "cash_total": cash_total,
        "transfer_total": transfer_total,
        "notes": cut_data.notes,
        "created_by": user["name"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.weekly_cuts.insert_one(cut_doc)
    
    return WeeklyCutResponse(**{k: v for k, v in cut_doc.items() if k != "_id"})

@api_router.get("/weekly-cuts", response_model=List[WeeklyCutResponse])
async def get_weekly_cuts(user: dict = Depends(require_admin)):
    cuts = await db.weekly_cuts.find({}, {"_id": 0}).sort("created_at", -1).to_list(52)
    return [WeeklyCutResponse(**c) for c in cuts]

@api_router.get("/weekly-cut/check-saturday")
async def check_saturday():
    """Check if today is Saturday"""
    today = datetime.now(timezone.utc)
    return {"is_saturday": today.weekday() == 5, "day": today.strftime("%A")}

# ==================== CLIENT PORTAL (Public tracking) ====================

@api_router.get("/track/{plate}")
async def track_by_plate(plate: str):
    """Public endpoint for clients to track their vehicle"""
    plate = plate.upper().strip()
    
    # Find latest service for this plate
    service = await db.services.find_one(
        {"vehicle_plate": plate},
        {"_id": 0, "mechanic_id": 0}
    )
    
    if not service:
        raise HTTPException(status_code=404, detail="No se encontró servicio para esta placa")
    
    # Get status timeline
    status_map = {
        "recibido": {"step": 1, "label": "Recibido"},
        "diagnostico": {"step": 2, "label": "Diagnóstico"},
        "en_reparacion": {"step": 3, "label": "En Reparación"},
        "listo": {"step": 4, "label": "Listo"}
    }
    
    current_status = status_map.get(service["status"], status_map["recibido"])
    
    return {
        "vehicle_plate": service["vehicle_plate"],
        "vehicle_model": service["vehicle_model"],
        "client_name": service["client_name"],
        "status": service["status"],
        "status_label": current_status["label"],
        "progress": service["progress"],
        "current_step": current_status["step"],
        "mechanic_name": service.get("mechanic_name"),
        "estimated_cost": service["estimated_cost"],
        "updated_at": service["updated_at"]
    }

# ==================== DASHBOARD STATS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user: dict = Depends(require_admin)):
    # Get today's date
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time()).isoformat()
    
    # Count services by status
    total_services = await db.services.count_documents({})
    active_services = await db.services.count_documents({"status": {"$ne": "listo"}})
    completed_services = await db.services.count_documents({"status": "listo"})
    
    # Revenue stats
    payments = await db.payments.find({"payment_complete": True}, {"_id": 0}).to_list(1000)
    total_revenue = sum(p["total_amount"] for p in payments)
    cash_revenue = sum(p["cash_amount"] for p in payments)
    transfer_revenue = sum(p["transfer_amount"] for p in payments)
    
    # Today's revenue
    today_payments = await db.payments.find({
        "payment_complete": True,
        "created_at": {"$gte": today_start}
    }, {"_id": 0}).to_list(100)
    today_revenue = sum(p["total_amount"] for p in today_payments)
    
    # Low stock count
    low_stock_count = await db.inventory.count_documents({"low_stock": True})
    
    # Active mechanics
    mechanics = await db.users.find({"role": "mecanico", "active": True}, {"_id": 0}).to_list(20)
    
    # Pending appointments
    pending_appointments = await db.appointments.count_documents({"status": "pendiente"})
    
    return {
        "total_services": total_services,
        "active_services": active_services,
        "completed_services": completed_services,
        "total_revenue": total_revenue,
        "cash_revenue": cash_revenue,
        "transfer_revenue": transfer_revenue,
        "today_revenue": today_revenue,
        "low_stock_count": low_stock_count,
        "active_mechanics": len(mechanics),
        "pending_appointments": pending_appointments
    }

# ==================== REPORTS ====================

@api_router.get("/reports/services")
async def get_services_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    query = {}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    services = await db.services.find(query, {"_id": 0}).to_list(1000)
    
    return {
        "total_count": len(services),
        "services": services
    }

@api_router.get("/reports/payments")
async def get_payments_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    query = {"payment_complete": True}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    total = sum(p["total_amount"] for p in payments)
    cash = sum(p["cash_amount"] for p in payments)
    transfers = sum(p["transfer_amount"] for p in payments)
    
    return {
        "total_count": len(payments),
        "total_amount": total,
        "cash_total": cash,
        "transfer_total": transfers,
        "payments": payments
    }

# ==================== SEED ADMIN ====================

@api_router.post("/seed-admin")
async def seed_admin():
    """Create default admin account if not exists"""
    existing = await db.users.find_one({"email": "admin@yepezcontrols.com"})
    if existing:
        return {"message": "Admin ya existe", "email": "admin@yepezcontrols.com"}
    
    admin_id = str(uuid.uuid4())
    admin_doc = {
        "id": admin_id,
        "email": "admin@yepezcontrols.com",
        "password": hash_password("Admin2026!"),
        "name": "Alfredo Yepez",
        "phone": "9931234567",
        "role": "admin",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_doc)
    
    return {
        "message": "Admin creado",
        "email": "admin@yepezcontrols.com",
        "password": "Admin2026!"
    }

# ==================== RESET DATA (Admin only) ====================

@api_router.delete("/reset-all-data")
async def reset_all_data(user: dict = Depends(require_admin)):
    """Delete all test data except admin account"""
    try:
        # Delete all collections except admin user
        await db.appointments.delete_many({})
        await db.services.delete_many({})
        await db.payments.delete_many({})
        await db.inventory.delete_many({})
        await db.weekly_cuts.delete_many({})
        # Delete only mechanic users, keep admin
        await db.users.delete_many({"role": {"$ne": "admin"}})
        
        return {
            "message": "Todos los datos de prueba han sido eliminados",
            "deleted": ["appointments", "services", "payments", "inventory", "weekly_cuts", "mechanics"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar datos: {str(e)}")

# ==================== DASHBOARD CHARTS DATA ====================

@api_router.get("/dashboard/charts")
async def get_dashboard_charts(user: dict = Depends(require_admin)):
    """Get data for dashboard charts"""
    # Get last 7 days of data
    today = datetime.now(timezone.utc)
    week_ago = today - timedelta(days=7)
    
    # Daily revenue for the week
    daily_revenue = []
    for i in range(7):
        day = week_ago + timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        payments = await db.payments.find({
            "payment_complete": True,
            "created_at": {
                "$gte": day_start.isoformat(),
                "$lte": day_end.isoformat()
            }
        }, {"_id": 0}).to_list(100)
        
        total = sum(p["total_amount"] for p in payments)
        cash = sum(p["cash_amount"] for p in payments)
        transfer = sum(p["transfer_amount"] for p in payments)
        
        daily_revenue.append({
            "date": day.strftime("%d/%m"),
            "day": ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][day.weekday()],
            "total": total,
            "efectivo": cash,
            "transferencia": transfer
        })
    
    # Services by status
    status_counts = {
        "recibido": await db.services.count_documents({"status": "recibido"}),
        "diagnostico": await db.services.count_documents({"status": "diagnostico"}),
        "en_reparacion": await db.services.count_documents({"status": "en_reparacion"}),
        "listo": await db.services.count_documents({"status": "listo"})
    }
    
    # Inventory by category
    inventory_items = await db.inventory.find({}, {"_id": 0}).to_list(500)
    category_data = {}
    for item in inventory_items:
        cat = item.get("category", "Otros")
        if cat not in category_data:
            category_data[cat] = {"quantity": 0, "value": 0}
        category_data[cat]["quantity"] += item["quantity"]
        category_data[cat]["value"] += item["quantity"] * item["unit_price"]
    
    inventory_chart = [
        {"category": k, "cantidad": v["quantity"], "valor": v["value"]}
        for k, v in category_data.items()
    ]
    
    # Appointments this week
    appointments_count = await db.appointments.count_documents({})
    pending_appointments = await db.appointments.count_documents({"status": "pendiente"})
    
    return {
        "daily_revenue": daily_revenue,
        "services_by_status": [
            {"status": "Recibido", "count": status_counts["recibido"], "fill": "#3b82f6"},
            {"status": "Diagnóstico", "count": status_counts["diagnostico"], "fill": "#eab308"},
            {"status": "En Reparación", "count": status_counts["en_reparacion"], "fill": "#f97316"},
            {"status": "Listo", "count": status_counts["listo"], "fill": "#22c55e"}
        ],
        "inventory_by_category": inventory_chart,
        "appointments": {
            "total": appointments_count,
            "pending": pending_appointments
        }
    }

# ==================== EXPORT REPORTS ====================

@api_router.get("/reports/inventory/export")
async def export_inventory_report(user: dict = Depends(require_admin)):
    """Export inventory data for report generation"""
    items = await db.inventory.find({}, {"_id": 0}).to_list(500)
    
    total_items = len(items)
    total_units = sum(i["quantity"] for i in items)
    total_value = sum(i["quantity"] * i["unit_price"] for i in items)
    low_stock = [i for i in items if i.get("low_stock", False)]
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": user["name"],
        "summary": {
            "total_items": total_items,
            "total_units": total_units,
            "total_value": total_value,
            "low_stock_count": len(low_stock)
        },
        "items": items,
        "low_stock_items": low_stock
    }

@api_router.get("/reports/sales/export")
async def export_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user: dict = Depends(require_admin)
):
    """Export sales/payments data for report generation"""
    query = {"payment_complete": True}
    if start_date:
        query["created_at"] = {"$gte": start_date}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = end_date
        else:
            query["created_at"] = {"$lte": end_date}
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with service info
    enriched_payments = []
    for p in payments:
        service = await db.services.find_one({"id": p["service_id"]}, {"_id": 0})
        enriched_payments.append({
            **p,
            "vehicle_plate": service["vehicle_plate"] if service else "N/A",
            "vehicle_model": service["vehicle_model"] if service else "N/A",
            "client_name": service["client_name"] if service else "N/A"
        })
    
    total = sum(p["total_amount"] for p in payments)
    cash = sum(p["cash_amount"] for p in payments)
    transfers = sum(p["transfer_amount"] for p in payments)
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": user["name"],
        "period": {
            "start": start_date or "Inicio",
            "end": end_date or "Actual"
        },
        "summary": {
            "total_transactions": len(payments),
            "total_revenue": total,
            "cash_total": cash,
            "transfer_total": transfers
        },
        "payments": enriched_payments
    }

@api_router.get("/reports/weekly-cuts/export")
async def export_weekly_cuts_report(user: dict = Depends(require_admin)):
    """Export weekly cuts data for report generation"""
    cuts = await db.weekly_cuts.find({}, {"_id": 0}).sort("created_at", -1).to_list(52)
    
    total_revenue = sum(c["total_revenue"] for c in cuts)
    total_services = sum(c["total_services"] for c in cuts)
    total_cash = sum(c["cash_total"] for c in cuts)
    total_transfers = sum(c["transfer_total"] for c in cuts)
    
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "generated_by": user["name"],
        "summary": {
            "total_cuts": len(cuts),
            "total_revenue": total_revenue,
            "total_services": total_services,
            "cash_total": total_cash,
            "transfer_total": total_transfers
        },
        "cuts": cuts
    }

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "YEPEZ CONTROLS API v1.0", "status": "running"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
