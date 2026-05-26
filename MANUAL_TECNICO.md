# MANUAL TÉCNICO DEL PROYECTO "YEPEZ CONTROLS"

## Dashboard de Monitoreo y Control de Procesos

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Autores:** Equipo de Desarrollo YEPEZ

---

## Tabla de Contenido

1. [Objetivo](#objetivo)
2. [Descripción General del Software](#descripción-general-del-software)
3. [Requerimientos Técnicos del Sistema](#requerimientos-técnicos-del-sistema)
4. [Instalación y Configuración](#instalación-y-configuración)
5. [Arquitectura del Software](#arquitectura-del-software)
6. [Estándares de Diseño del Software](#estándares-de-diseño-del-software)
7. [Modelo de Base de Datos](#modelo-de-base-de-datos)
8. [Diccionario de Datos](#diccionario-de-datos)
9. [Estructura de Directorios](#estructura-de-directorios)
10. [Guía de Desarrollo](#guía-de-desarrollo)
11. [Seguridad del Sistema](#seguridad-del-sistema)
12. [Backup y Recuperación](#backup-y-recuperación)
13. [Restricciones del Sistema](#restricciones-del-sistema)
14. [Recomendaciones Generales](#recomendaciones-generales)

---

## 1. Objetivo

El presente manual técnico tiene como propósito brindar a los desarrolladores, administradores del sistema y personal técnico un conocimiento técnico y avanzado sobre la arquitectura, componentes y características internas del software **YEPEZ CONTROLS**. Proporciona especificaciones necesarias para la instalación, configuración, operación y mantenimiento del aplicativo.

---

## 2. Descripción General del Software

### Propósito del Sistema

**YEPEZ CONTROLS** es un dashboard web moderno diseñado para proporcionar monitoreo y control de procesos administrativos en tiempo real. El aplicativo integra una interfaz de usuario de alto rendimiento con un backend robusto que permite:

- Visualización de datos en tiempo real
- Control centralizado de operaciones
- Gestión de usuarios y permisos
- Generación de reportes
- Análisis de datos históricos
- Autenticación segura

### Características Principales

- **Interface de Usuario Moderna**: Diseño industrial con tema oscuro
- **Responsivo**: Compatible con dispositivos de escritorio, tablet y móvil
- **Performance**: Optimizado para carga rápida y bajo consumo de recursos
- **Escalable**: Arquitectura modular permitiendo expansión futura
- **Seguro**: Autenticación JWT y autorización basada en roles
- **Real-time**: Soporte para actualizaciones en tiempo real

---

## 3. Requerimientos Técnicos del Sistema

### 3.1 Requerimientos de Ambiente de Desarrollo

#### Hardware Mínimo

- **Procesador:** Intel Core i5 o equivalente AMD Ryzen 5
- **RAM:** 8 GB (16 GB recomendado)
- **Disco Duro:** 500 GB SSD
- **Conexión:** Internet de banda ancha

#### Software

**Backend:**
- Python 3.9 o superior
- FastAPI 0.110.1
- Uvicorn 0.25.0
- MongoDB 5.0 o superior
- Docker (opcional pero recomendado)

**Frontend:**
- Node.js 18.x o superior
- npm 9.x o superior
- React 18.3.1
- TypeScript 4.9 o superior

**Herramientas de Desarrollo:**
- Git 2.30+
- Visual Studio Code o IDE equivalente
- Postman o Thunder Client (para pruebas API)

### 3.2 Requerimientos de Ambiente de Producción

#### Hardware

- **Servidor Backend:**
  - Procesador: 4+ cores
  - RAM: 8 GB mínimo
  - Almacenamiento: 1 TB SSD

- **Base de Datos:**
  - Procesador: 4+ cores
  - RAM: 16 GB mínimo
  - Almacenamiento: 2 TB SSD

- **Servidor Frontend:**
  - Procesador: 2+ cores
  - RAM: 4 GB
  - Almacenamiento: 100 GB SSD

#### Software

- Linux Ubuntu 20.04 LTS o superior (recomendado)
- Docker 20.10+
- Docker Compose 2.0+
- Nginx 1.20+ (como reverse proxy)
- MongoDB Enterprise 5.0+
- SSL/TLS Certificate

---

## 4. Instalación y Configuración

### 4.1 Requisitos Previos

```bash
# Verificar Python
python --version  # Debe ser 3.9 o superior

# Verificar Node.js
node --version    # Debe ser 18.x o superior
npm --version     # Debe ser 9.x o superior

# Verificar Git
git --version
```

### 4.2 Clonación del Repositorio

```bash
# Clonar el repositorio
git clone https://github.com/YepezDev/YEPEZ-CONTROLS.git

# Navegar al directorio
cd Taller-YEPEZ-main

# Crear la estructura de directorios si es necesaria
mkdir -p backend frontend
```

### 4.3 Configuración del Backend

#### 4.3.1 Instalación de Dependencias

```bash
# Navegar al directorio backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate

# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt
```

#### 4.3.2 Configuración de Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```env
# Configuración de Base de Datos
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=yepez_controls

# Configuración de Servidor
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Configuración de Seguridad
SECRET_KEY=tu-clave-secreta-muy-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración de CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Configuración de Email (opcional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SENDER_EMAIL=tu-email@gmail.com
SENDER_PASSWORD=tu-contraseña-app

# Configuración de AWS S3 (opcional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=yepez-controls
```

#### 4.3.3 Inicializar Base de Datos

```bash
# Verificar conexión a MongoDB
python -c "import pymongo; print(pymongo.__version__)"

# Ejecutar migraciones (si existen)
# python scripts/migrate_db.py
```

#### 4.3.4 Ejecutar el Servidor Backend

```bash
# Desarrollo
uvicorn server:app --reload --host 0.0.0.0 --port 8000

# Producción
gunicorn -w 4 -k uvicorn.workers.UvicornWorker server:app --bind 0.0.0.0:8000
```

### 4.4 Configuración del Frontend

#### 4.4.1 Instalación de Dependencias

```bash
# Navegar al directorio frontend
cd frontend

# Instalar dependencias
npm install

# O con yarn
yarn install
```

#### 4.4.2 Configuración de Variables de Entorno

Crear archivo `.env` en la carpeta `frontend/`:

```env
# Configuración de API
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws

# Configuración de Aplicación
REACT_APP_NAME=YEPEZ CONTROLS
REACT_APP_VERSION=1.0.0

# Configuración de Ambiente
REACT_APP_ENV=development
```

#### 4.4.3 Ejecutar el Servidor Frontend

```bash
# Desarrollo
npm start

# Compilación de producción
npm run build

# Ejecutar compilación en producción
npm run serve
```

### 4.5 Docker (Recomendado)

#### 4.5.1 Estructura Docker

```dockerfile
# Dockerfile - Backend
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 4.5.2 Docker Compose

```yaml
version: '3.9'

services:
  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
    environment:
      MONGODB_URL: mongodb://root:password@mongodb:27017
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      REACT_APP_API_URL: http://localhost:8000/api

volumes:
  mongodb_data:
```

#### 4.5.3 Ejecutar con Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

---

## 5. Arquitectura del Software

### 5.1 Patrón de Arquitectura

El proyecto utiliza una **arquitectura de tres capas (Three-Tier Architecture)**:

```
┌─────────────────────────────────────┐
│   PRESENTACIÓN (Frontend)           │
│   - React                           │
│   - Componentes UI                  │
│   - Gestión de Estado               │
└─────────────────┬───────────────────┘
                  │ REST API
                  │
┌─────────────────▼───────────────────┐
│   LÓGICA DE NEGOCIO (Backend)       │
│   - FastAPI                         │
│   - Controladores                   │
│   - Servicios                       │
│   - Validaciones                    │
└─────────────────┬───────────────────┘
                  │ Drivers
                  │
┌─────────────────▼───────────────────┐
│   ACCESO A DATOS (Persistencia)     │
│   - MongoDB                         │
│   - Cache (Redis)                   │
│   - Almacenamiento Externo (S3)     │
└─────────────────────────────────────┘
```

### 5.2 Flujo de Datos

1. **Cliente (Frontend)**: Usuario interactúa con la interfaz React
2. **HTTP Request**: Frontend envía solicitud a la API REST
3. **Backend (FastAPI)**: Procesa la solicitud y aplica lógica de negocio
4. **Base de Datos**: Persiste o recupera datos en MongoDB
5. **Response**: Backend retorna datos en formato JSON
6. **Frontend Render**: React actualiza la interfaz con los datos

### 5.3 Componentes Principales

#### Backend (FastAPI)

```
backend/
├── server.py                 # Punto de entrada
├── config/
│   └── settings.py          # Configuración global
├── routes/
│   ├── auth.py              # Autenticación
│   ├── users.py             # Gestión de usuarios
│   ├── dashboard.py         # Dashboard
│   └── reports.py           # Reportes
├── models/
│   ├── user.py              # Modelo User
│   ├── dashboard.py         # Modelo Dashboard
│   └── schemas.py           # Esquemas Pydantic
├── services/
│   ├── auth_service.py      # Lógica de autenticación
│   ├── user_service.py      # Lógica de usuarios
│   └── dashboard_service.py # Lógica del dashboard
├── middleware/
│   ├── auth.py              # Middleware de autenticación
│   └── cors.py              # Middleware de CORS
└── utils/
    ├── jwt_handler.py       # Manejo de JWT
    └── validators.py        # Validadores
```

#### Frontend (React)

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── App.js               # Componente raíz
│   ├── index.js             # Punto de entrada
│   ├── components/
│   │   ├── Layout/
│   │   ├── Dashboard/
│   │   ├── Auth/
│   │   └── Common/
│   ├── pages/
│   │   ├── Dashboard.js
│   │   ├── Login.js
│   │   └── NotFound.js
│   ├── context/
│   │   └── AuthContext.js   # Contexto de autenticación
│   ├── hooks/
│   │   └── useAuth.js       # Hook personalizado
│   ├── services/
│   │   └── api.js           # Cliente HTTP (Axios)
│   ├── utils/
│   │   └── helpers.js
│   └── styles/
│       └── globals.css
└── package.json
```

---

## 6. Estándares de Diseño del Software

### 6.1 Convenciones de Nomenclatura

#### Backend (Python)

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos | snake_case | `user_service.py` |
| Clases | PascalCase | `UserModel`, `AuthService` |
| Funciones | snake_case | `get_user()`, `create_user()` |
| Constantes | UPPER_CASE | `MAX_CONNECTIONS`, `API_TIMEOUT` |
| Variables | snake_case | `user_id`, `is_active` |

#### Frontend (JavaScript/React)

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Archivos Componente | PascalCase | `UserProfile.jsx` |
| Archivos Utilidad | camelCase | `authService.js` |
| Componentes | PascalCase | `LoginForm`, `Dashboard` |
| Funciones | camelCase | `handleSubmit()`, `fetchData()` |
| Hooks | camelCase | `useAuth()`, `useFetch()` |
| Constantes | UPPER_CASE | `MAX_RETRIES`, `API_TIMEOUT` |
| CSS Classes | kebab-case | `user-profile`, `btn-primary` |

### 6.2 Estructura de API REST

#### Endpoints

```
GET    /api/users              # Listar usuarios
GET    /api/users/{id}         # Obtener usuario específico
POST   /api/users              # Crear usuario
PUT    /api/users/{id}         # Actualizar usuario
DELETE /api/users/{id}         # Eliminar usuario

GET    /api/dashboard          # Datos del dashboard
GET    /api/dashboard/stats    # Estadísticas
POST   /api/reports            # Generar reporte

POST   /api/auth/login         # Login
POST   /api/auth/logout        # Logout
POST   /api/auth/refresh       # Refrescar token
```

#### Formato de Respuesta

**Éxito (200 OK):**
```json
{
  "success": true,
  "status": 200,
  "message": "Operación completada",
  "data": {
    "id": "123",
    "name": "Usuario",
    "email": "user@example.com"
  },
  "timestamp": "2026-05-18T10:30:00Z"
}
```

**Error (400 Bad Request):**
```json
{
  "success": false,
  "status": 400,
  "message": "Validación fallida",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ],
  "timestamp": "2026-05-18T10:30:00Z"
}
```

### 6.3 Autenticación y Autorización

#### JWT Token Structure

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Payload:**
```json
{
  "sub": "user_id",
  "name": "Usuario",
  "email": "user@example.com",
  "role": "admin",
  "iat": 1516239022,
  "exp": 1516242622
}
```

#### Roles y Permisos

```
ADMIN:
  - Crear/Editar/Eliminar usuarios
  - Acceso completo al dashboard
  - Generar reportes
  - Gestionar configuración

MANAGER:
  - Ver dashboard
  - Generar reportes básicos
  - Ver usuarios

USER:
  - Ver datos asignados
  - Generar reportes personales
```

### 6.4 Estándares de Codificación

#### Backend - Estilo PEP 8

```python
# Imports
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends

# Constantes
MAX_RETRIES = 3
API_TIMEOUT = 30

# Clases
class UserService:
    """Servicio de gestión de usuarios."""
    
    def __init__(self, db):
        self.db = db
    
    def get_user(self, user_id: str) -> Optional[dict]:
        """
        Obtiene un usuario por ID.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Diccionario del usuario o None
        """
        return self.db.users.find_one({"_id": user_id})

# Funciones
def validate_email(email: str) -> bool:
    """Valida formato de email."""
    return "@" in email and "." in email.split("@")[1]
```

#### Frontend - Estilo ESLint/Prettier

```javascript
// Imports
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Constantes
const API_TIMEOUT = 30000;
const MAX_RETRIES = 3;

// Componentes
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, [userId]);

  const fetchUser = async (id) => {
    try {
      const response = await axios.get(`/api/users/${id}`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-profile">
      {loading ? <p>Cargando...</p> : <p>{user?.name}</p>}
    </div>
  );
}

export default UserProfile;
```

---

## 7. Modelo de Base de Datos

### 7.1 Diagrama ER (Entity-Relationship)

```
┌──────────────┐       ┌──────────────┐
│    Users     │       │     Roles    │
├──────────────┤       ├──────────────┤
│ _id (PK)     │───┬──▶│ _id (PK)     │
│ email        │   │   │ name         │
│ password     │   │   │ permissions  │
│ role_id (FK) │───┘   │ created_at   │
│ status       │       └──────────────┘
│ created_at   │
└──────────────┘

┌──────────────┐       ┌──────────────┐
│ Dashboard    │       │  Reports     │
├──────────────┤       ├──────────────┤
│ _id (PK)     │───┬──▶│ _id (PK)     │
│ user_id (FK) │   │   │ user_id (FK) │
│ metrics      │   │   │ type         │
│ data         │   │   │ content      │
│ updated_at   │   │   │ created_at   │
└──────────────┘   └──▶└──────────────┘
```

---

## 8. Diccionario de Datos

### 8.1 Colección: Users

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| _id | ObjectId | Sí | Identificador único |
| email | String | Sí | Correo electrónico (único) |
| password | String | Sí | Contraseña hasheada |
| first_name | String | No | Primer nombre |
| last_name | String | No | Apellido |
| role_id | ObjectId | Sí | Referencia a rol |
| status | String | Sí | Estado (active/inactive) |
| last_login | DateTime | No | Último acceso |
| created_at | DateTime | Sí | Fecha de creación |
| updated_at | DateTime | Sí | Fecha de actualización |

### 8.2 Colección: Roles

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| _id | ObjectId | Sí | Identificador único |
| name | String | Sí | Nombre del rol |
| permissions | Array | Sí | Lista de permisos |
| description | String | No | Descripción del rol |
| created_at | DateTime | Sí | Fecha de creación |

### 8.3 Colección: Dashboard

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| _id | ObjectId | Sí | Identificador único |
| user_id | ObjectId | Sí | ID del usuario |
| metrics | Object | Sí | Datos de métricas |
| widgets | Array | No | Configuración de widgets |
| updated_at | DateTime | Sí | Última actualización |

---

## 9. Estructura de Directorios

```
Taller-YEPEZ-main/
│
├── backend/
│   ├── __init__.py
│   ├── server.py                    # Aplicación principal FastAPI
│   ├── requirements.txt             # Dependencias Python
│   ├── .env                         # Variables de entorno
│   │
│   ├── config/
│   │   └── settings.py              # Configuración de aplicación
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                  # Modelo de Usuario
│   │   ├── role.py                  # Modelo de Rol
│   │   └── dashboard.py             # Modelo de Dashboard
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user_schema.py           # Esquema Pydantic de Usuario
│   │   └── dashboard_schema.py      # Esquema de Dashboard
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py                  # Rutas de autenticación
│   │   ├── users.py                 # Rutas de usuarios
│   │   ├── dashboard.py             # Rutas del dashboard
│   │   └── reports.py               # Rutas de reportes
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py          # Lógica de autenticación
│   │   ├── user_service.py          # Lógica de usuarios
│   │   ├── dashboard_service.py     # Lógica del dashboard
│   │   └── report_service.py        # Lógica de reportes
│   │
│   ├── middleware/
│   │   ├── __init__.py
│   │   ├── auth_middleware.py       # Middleware de autenticación
│   │   └── error_handler.py         # Manejo de errores
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── jwt_handler.py           # Manejo de JWT
│   │   ├── password_handler.py      # Hasheado de contraseñas
│   │   ├── validators.py            # Funciones de validación
│   │   └── logger.py                # Logging
│   │
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_users.py
│   │   └── test_dashboard.py
│   │
│   └── Dockerfile
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── index.js                 # Punto de entrada
│   │   ├── App.js                   # Componente principal
│   │   │
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── Layout.jsx
│   │   │   │
│   │   │   ├── Dashboard/
│   │   │   │   ├── DashboardGrid.jsx
│   │   │   │   ├── MetricsCard.jsx
│   │   │   │   └── Charts.jsx
│   │   │   │
│   │   │   ├── Auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   │
│   │   │   └── Common/
│   │   │       ├── Button.jsx
│   │   │       ├── Input.jsx
│   │   │       └── Modal.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Users.jsx
│   │   │   └── NotFound.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Contexto global de autenticación
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Hook de autenticación
│   │   │   ├── useFetch.js          # Hook de datos
│   │   │   └── useForm.js           # Hook de formularios
│   │   │
│   │   ├── services/
│   │   │   ├── api.js               # Cliente HTTP (Axios)
│   │   │   ├── auth.js              # Servicios de auth
│   │   │   ├── users.js             # Servicios de usuarios
│   │   │   └── dashboard.js         # Servicios del dashboard
│   │   │
│   │   ├── utils/
│   │   │   ├── helpers.js           # Funciones auxiliares
│   │   │   ├── constants.js         # Constantes
│   │   │   ├── formatters.js        # Formateo de datos
│   │   │   └── validators.js        # Validaciones
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   └── components.css
│   │   │
│   │   └── App.css
│   │
│   ├── .env                         # Variables de entorno
│   ├── package.json
│   ├── package-lock.json
│   ├── .gitignore
│   └── Dockerfile
│
├── memory/
│   └── PRD.md                       # Product Requirements Document
│
├── test_reports/                    # Reportes de pruebas
│
├── .gitignore
├── docker-compose.yml               # Configuración Docker Compose
├── MANUAL_TECNICO.md               # Este archivo
└── README.md                        # Documentación general
```

---

## 10. Guía de Desarrollo

### 10.1 Flujo de Desarrollo

```
1. Crear rama feature
   git checkout -b feature/nombre-feature

2. Hacer cambios y commits
   git add .
   git commit -m "feat: descripción del cambio"

3. Push a repositorio remoto
   git push origin feature/nombre-feature

4. Crear Pull Request
   - Describir cambios
   - Solicitar revisión

5. Merge a main después de aprobación
   git checkout main
   git pull
   git merge feature/nombre-feature
```

### 10.2 Flujo de API

#### Crear un nuevo endpoint

**Backend (FastAPI):**

```python
# routes/items.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter(prefix="/api/items", tags=["items"])

# Dependency
async def get_item_service():
    return ItemService()

@router.get("/", response_model=List[ItemSchema])
async def list_items(service: ItemService = Depends(get_item_service)):
    """Lista todos los items."""
    return await service.get_all()

@router.get("/{item_id}", response_model=ItemSchema)
async def get_item(item_id: str, service: ItemService = Depends(get_item_service)):
    """Obtiene un item específico."""
    item = await service.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    return item

@router.post("/", response_model=ItemSchema)
async def create_item(item: ItemCreateSchema, service: ItemService = Depends(get_item_service)):
    """Crea un nuevo item."""
    return await service.create(item)
```

**Frontend (React):**

```javascript
// services/items.js
import api from './api';

export const itemService = {
  getAll: () => api.get('/items'),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`)
};

// components/ItemsList.jsx
import { useState, useEffect } from 'react';
import { itemService } from '../services/items';

function ItemsList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await itemService.getAll();
      setItems(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Cargando...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {items.map(item => (
        <li key={item._id}>{item.name}</li>
      ))}
    </ul>
  );
}

export default ItemsList;
```

### 10.3 Testing

#### Backend - Pytest

```python
# tests/test_users.py
import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)

@pytest.fixture
def sample_user():
    return {
        "email": "test@example.com",
        "password": "password123",
        "first_name": "Test"
    }

def test_create_user(sample_user):
    response = client.post("/api/users", json=sample_user)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == sample_user["email"]

def test_get_user(sample_user):
    # Crear usuario
    create_response = client.post("/api/users", json=sample_user)
    user_id = create_response.json()["_id"]
    
    # Obtener usuario
    response = client.get(f"/api/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["email"] == sample_user["email"]
```

#### Frontend - Jest/React Testing Library

```javascript
// components/__tests__/ItemsList.test.js
import { render, screen, waitFor } from '@testing-library/react';
import ItemsList from '../ItemsList';
import * as itemService from '../../services/items';

jest.mock('../../services/items');

describe('ItemsList', () => {
  it('renderiza lista de items', async () => {
    itemService.getAll.mockResolvedValue({
      data: [
        { _id: '1', name: 'Item 1' },
        { _id: '2', name: 'Item 2' }
      ]
    });

    render(<ItemsList />);

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });
});
```

### 10.4 Ejecutar Pruebas

```bash
# Backend
cd backend
pytest                           # Ejecutar todas las pruebas
pytest tests/test_users.py      # Pruebas específicas
pytest -v                       # Modo verbose
pytest --cov                    # Con cobertura

# Frontend
cd frontend
npm test                        # Ejecutar pruebas
npm test -- --coverage         # Con cobertura
npm run test:watch            # Modo watch
```

---

## 11. Seguridad del Sistema

### 11.1 Autenticación

**Implementación JWT:**

```python
# Backend - Generación de Token
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

### 11.2 Autorización Basada en Roles

```python
# Backend - Middleware de Autorización
from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthCredentials

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthCredentials = Security(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id

async def require_admin(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"_id": user_id})
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str, current_user = Depends(require_admin)):
    # Solo admins pueden eliminar usuarios
    pass
```

### 11.3 Validación de Entrada

```python
# Backend - Validación con Pydantic
from pydantic import BaseModel, EmailStr, Field, validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=50)
    
    @validator('password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain digit')
        return v
```

### 11.4 CORS (Cross-Origin Resource Sharing)

```python
# Backend - Configuración de CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 11.5 Rate Limiting

```python
# Backend - Rate Limiting
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.util import get_remote_address

@app.on_event("startup")
async def startup():
    await FastAPILimiter.init(redis.Redis())

@limiter.limit("5/minute")
@app.post("/api/auth/login")
async def login(credentials: LoginSchema, request: Request):
    # Máximo 5 intentos de login por minuto
    pass
```

### 11.6 Encriptación de Datos Sensibles

```python
# Backend - Encriptación
from cryptography.fernet import Fernet

cipher = Fernet(ENCRYPTION_KEY)

def encrypt_sensitive_data(data: str) -> str:
    return cipher.encrypt(data.encode()).decode()

def decrypt_sensitive_data(encrypted_data: str) -> str:
    return cipher.decrypt(encrypted_data.encode()).decode()
```

---

## 12. Backup y Recuperación

### 12.1 Backup Automático de MongoDB

```bash
# Backup manual
mongodump --uri "mongodb://localhost:27017/yepez_controls" --out /backup/dump

# Restauración
mongorestore --uri "mongodb://localhost:27017/yepez_controls" /backup/dump/yepez_controls

# Con Docker
docker exec mongodb mongodump --uri "mongodb://localhost:27017" --out /data/backup
docker cp mongodb:/data/backup ./backups
```

### 12.2 Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
MONGO_URI="mongodb://localhost:27017"
DB_NAME="yepez_controls"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Realizar backup
mongodump --uri "$MONGO_URI" --db $DB_NAME --out $BACKUP_DIR/$DATE

# Comprimir
tar -czf $BACKUP_DIR/$DATE.tar.gz $BACKUP_DIR/$DATE
rm -rf $BACKUP_DIR/$DATE

# Limpiar backups antiguos (más de 30 días)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completado: $BACKUP_DIR/$DATE.tar.gz"
```

### 12.3 Restauración de Backup

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE="$1"
MONGO_URI="mongodb://localhost:27017"

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: ./restore.sh /ruta/a/backup.tar.gz"
    exit 1
fi

# Extraer backup
tar -xzf $BACKUP_FILE -C /tmp

# Restaurar en MongoDB
mongorestore --uri "$MONGO_URI" /tmp/*/

echo "Restauración completada"
```

---

## 13. Restricciones del Sistema

### 13.1 Limitaciones de Navegadores

El aplicativo es completamente funcional en navegadores modernos:

- ✅ **Chrome** 90+
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+
- ❌ **Internet Explorer** (No soportado)

### 13.2 Limitaciones de Rendimiento

- Máximo 10,000 registros por página
- Máximo 100 usuarios simultáneos
- Timeout de conexión: 30 segundos
- Tamaño máximo de archivo: 100 MB

### 13.3 Limitaciones de Almacenamiento

- Espacio mínimo en servidor: 1 TB
- Retención de datos: 2 años
- Almacenamiento de backups: 3 años

---

## 14. Recomendaciones Generales

### 14.1 Mejores Prácticas de Desarrollo

1. **Siempre usar rama develop**
   - No hacer commits directamente a main
   - Usar pull requests para revisión de código

2. **Mantener dependencias actualizadas**
   ```bash
   # Backend
   pip list --outdated
   pip install --upgrade package-name
   
   # Frontend
   npm outdated
   npm update
   ```

3. **Realizar pruebas antes de commit**
   ```bash
   # Backend
   pytest --cov
   flake8 .
   mypy .
   
   # Frontend
   npm test
   npm run build
   ```

4. **Documentar cambios importantes**
   - Incluir docstrings en funciones
   - Actualizar README si es necesario
   - Añadir comentarios en código complejo

### 14.2 Monitoreo y Logging

```python
# Configurar logging
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)
```

### 14.3 Mantenimiento de Servidor

- Hacer backup diariamente
- Revisar logs semanalmente
- Actualizar dependencias mensualmente
- Realizar auditoría de seguridad trimestralmente

### 14.4 Documentación

- Mantener README actualizado
- Documentar cambios en CHANGELOG.md
- Incluir ejemplos en documentación
- Usar docstrings descriptivos

### 14.5 Comunicación del Equipo

- Usar Git commits descriptivos
- Crear issues para problemas conocidos
- Documentar decisiones arquitectónicas
- Realizar reuniones de sincronización

---

## Contacto y Soporte

Para consultas técnicas o soporte:
- **Email**: soporte@yepezcontrols.com
- **GitHub Issues**: [YEPEZ-CONTROLS/issues](https://github.com/YepezDev/YEPEZ-CONTROLS/issues)
- **Documentation**: [Wiki](https://wiki.yepezcontrols.com)

---

**Última actualización:** Mayo 18, 2026  
**Versión del Manual:** 1.0
