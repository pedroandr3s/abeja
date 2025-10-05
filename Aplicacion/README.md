# 🐝 SmartBee - Aplicación Fullstack Unificada

Sistema de monitoreo inteligente para colmenas con React + Node.js + MySQL.

## 🚀 Inicio Rápido

### Instalación

```bash
cd Aplicacion
npm install
```

### Configuración

1. Edita `.env` con tus credenciales de MySQL:
   ```env
   PORT=3004
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=tu_password
   DB_NAME=smartbee
   ```

2. Ejecuta los scripts SQL en `../SQL/` para crear la base de datos

### Desarrollo

```bash
# Correr frontend (puerto 3000) y backend (puerto 3004) simultáneamente
npm run dev

# Windows
npm run dev:windows
```

### Producción

```bash
# 1. Compilar frontend
npm run build

# 2. Iniciar servidor unificado en puerto 3004
npm run backend
```

## 📡 Arquitectura

### Desarrollo
- **Frontend**: `http://localhost:3000` (React)
- **Backend**: `http://localhost:3004/api` (Express)
- **Database**: `127.0.0.1:3306` (MySQL)

### Producción
- **Todo**: `http://localhost:3004` (Frontend + Backend unificado)
- **Database**: `127.0.0.1:3306` (MySQL)

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Desarrollo: frontend + backend |
| `npm run backend` | Producción: servidor unificado |
| `npm run build` | Compilar frontend |
| `npm start` | Solo frontend (desarrollo) |
| `npm run backend:dev` | Solo backend con nodemon |

## 📖 Documentación Completa

Ver [INSTRUCCIONES.md](./INSTRUCCIONES.md) para la guía completa.

## ✅ Verificación

```bash
# Verificar backend
curl http://localhost:3004/api/health

# Verificar base de datos
curl http://localhost:3004/api/test-connection
```

## 🛠️ Solución de Problemas

### Backend no se conecta
```bash
# Verificar que MySQL esté corriendo
mysql -u root -p -e "SELECT 1"

# Verificar puerto 3004 disponible
netstat -an | grep 3004
```

### Frontend no se conecta al Backend
- Asegúrate que el backend esté corriendo en puerto 3004
- En desarrollo, el frontend usa puerto 3000 y se conecta automáticamente

## 📁 Estructura

```
Aplicacion/
├── Backend/         # Servidor Express + API
│   ├── config/     # Configuración DB, CORS, etc.
│   ├── routes/     # Rutas de la API
│   └── server.js   # Punto de entrada
├── src/            # Frontend React
│   ├── components/ # Componentes
│   ├── context/    # ApiContext
│   └── pages/      # Páginas
├── build/          # Frontend compilado (generado)
├── .env            # Variables de entorno
└── package.json    # Dependencias
```

## 🔐 Seguridad

- ⚠️ NO subas `.env` a Git
- ⚠️ Cambia `JWT_SECRET` en producción
- ⚠️ Usa contraseñas seguras

---

**¿Problemas?** Consulta [INSTRUCCIONES.md](./INSTRUCCIONES.md) para más detalles.