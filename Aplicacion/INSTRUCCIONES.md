# 🐝 SmartBee - Instrucciones de Instalación y Uso

## 📋 Descripción
Aplicación fullstack unificada que combina el frontend React y el backend Node.js/Express en un solo servidor.

## 🏗️ Arquitectura Unificada

### Puerto 3004
- **Backend API**: Servidor Express con todas las rutas `/api/*`
- **Frontend**: Archivos estáticos de React servidos por Express
- **Modo Desarrollo**: Frontend usa puerto 3000, Backend usa puerto 3004
- **Modo Producción**: Todo servido desde puerto 3004

### Puerto 3306
- **Base de Datos**: MySQL corriendo localmente

## 📦 Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** v14 o superior
- **MySQL** v5.7 o superior
- **npm** o **yarn**

## 🚀 Instalación

### 1. Instalar Dependencias

```bash
cd Aplicacion
npm install
```

### 2. Configurar Base de Datos MySQL

Ejecuta los scripts SQL en el siguiente orden:

```bash
# En tu cliente MySQL (MySQL Workbench, HeidiSQL, etc.):
# 1. Crear base de datos
mysql -u root -p < ../SQL/01\ SmartBee\ Create\ Database.sql

# 2. Crear usuario
mysql -u root -p < ../SQL/02\ SmartBee\ Create\ User.sql

# 3. Crear tablas
mysql -u root -p smartbee < ../SQL/03\ SmartBee\ Create\ Table.sql

# 4. Insertar datos iniciales
mysql -u root -p smartbee < ../SQL/04\ SmartBee\ Insert\ Into.sql
mysql -u root -p smartbee < ../SQL/05\ SmartBee\ Insert\ Into.sql
mysql -u root -p smartbee < ../SQL/06\ SmartBee\ Insert\ Into.sql
```

### 3. Configurar Variables de Entorno

Edita el archivo `.env` (ya creado) con tus credenciales de MySQL:

```env
PORT=3004

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password_mysql
DB_NAME=smartbee

JWT_SECRET=tu_clave_secreta_segura
```

## 🎯 Modo de Desarrollo

En modo desarrollo, el frontend y backend corren en puertos separados:

```bash
# Opción 1: Correr ambos servicios simultáneamente (RECOMENDADO)
npm run dev

# Opción 2: Correr servicios por separado
# Terminal 1 - Backend (puerto 3004)
npm run backend:dev

# Terminal 2 - Frontend (puerto 3000)
npm start
```

El frontend (puerto 3000) se conectará automáticamente al backend (puerto 3004).

### 🪟 Para Windows

Si estás en Windows, usa:

```bash
npm run dev:windows
```

## 🚢 Modo Producción

En modo producción, todo se sirve desde un solo puerto (3004):

### 1. Compilar Frontend

```bash
npm run build
```

Esto creará la carpeta `build/` con los archivos estáticos optimizados.

### 2. Iniciar Servidor Unificado

```bash
npm run prod:start
```

O simplemente:

```bash
npm run backend
```

Ahora puedes acceder a la aplicación completa en:
- **Frontend**: `http://localhost:3004`
- **API**: `http://localhost:3004/api`

## 📝 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia frontend React en puerto 3000 (desarrollo) |
| `npm run backend` | Inicia backend en puerto 3004 (producción) |
| `npm run backend:dev` | Inicia backend con nodemon (desarrollo) |
| `npm run dev` | Inicia frontend y backend simultáneamente |
| `npm run dev:windows` | Igual que dev pero para Windows |
| `npm run build` | Compila el frontend para producción |
| `npm run prod` | Compila frontend e inicia servidor producción |
| `npm run prod:start` | Inicia solo el servidor de producción |

## 🔍 Verificar Instalación

### 1. Verificar Backend

```bash
curl http://localhost:3004/api/health
```

Deberías ver:
```json
{
  "message": "SmartBee API funcionando correctamente",
  "timestamp": "2024-...",
  "database": "MySQL Local"
}
```

### 2. Verificar Conexión a Base de Datos

```bash
curl http://localhost:3004/api/test-connection
```

### 3. Acceder a la Aplicación

Abre tu navegador en:
- **Desarrollo**: `http://localhost:3000`
- **Producción**: `http://localhost:3004`

## 📊 Endpoints Principales

### Autenticación
- `POST /api/usuarios/login` - Iniciar sesión

### Usuarios
- `GET /api/usuarios` - Listar usuarios
- `GET /api/usuarios/:id` - Obtener usuario
- `POST /api/usuarios` - Crear usuario
- `PUT /api/usuarios/:id` - Actualizar usuario
- `DELETE /api/usuarios/:id` - Eliminar usuario

### Colmenas
- `GET /api/colmenas` - Listar colmenas
- `GET /api/colmenas/:id` - Obtener colmena
- `POST /api/colmenas` - Crear colmena
- `PUT /api/colmenas/:id` - Actualizar colmena

### Dashboard
- `GET /api/dashboard/stats` - Estadísticas generales
- `GET /api/dashboard/sensor-data` - Datos de sensores

### Alertas
- `GET /api/alertas/evaluar/:colmenaId` - Evaluar alertas
- `GET /api/alertas/usuario/:usuarioId` - Alertas por usuario

## 🛠️ Solución de Problemas

### Error: "ECONNREFUSED 127.0.0.1:3004"

**Problema**: El backend no está corriendo.

**Solución**:
```bash
npm run backend:dev
```

### Error: "ECONNREFUSED 127.0.0.1:3306"

**Problema**: MySQL no está corriendo o no está en el puerto correcto.

**Solución**:
```bash
# Windows
net start MySQL80

# Linux/Mac
sudo service mysql start
# o
sudo systemctl start mysql
```

### Error: "Access denied for user"

**Problema**: Credenciales incorrectas en `.env`

**Solución**: Verifica tu usuario y contraseña de MySQL en el archivo `.env`

### Frontend no se conecta al Backend

**Problema**: El puerto del backend es incorrecto.

**Solución**: Verifica que el backend esté corriendo en el puerto 3004:
```bash
netstat -an | grep 3004
```

### Puerto 3004 ya está en uso

**Solución**:
```bash
# Windows
netstat -ano | findstr :3004
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3004 | xargs kill -9
```

## 📦 Estructura del Proyecto

```
Aplicacion/
├── Backend/              # Servidor Express
│   ├── config/          # Configuraciones
│   ├── middleware/      # Middlewares
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de API
│   └── server.js        # Punto de entrada del backend
├── src/                 # Código fuente React
│   ├── components/      # Componentes React
│   ├── context/         # Context API (ApiContext)
│   ├── pages/           # Páginas
│   └── utils/           # Utilidades
├── public/              # Archivos públicos
├── build/               # Frontend compilado (generado)
├── .env                 # Variables de entorno
└── package.json         # Dependencias y scripts
```

## 🔐 Seguridad

- **NO** subas el archivo `.env` a control de versiones
- Cambia `JWT_SECRET` en producción
- Usa contraseñas seguras para MySQL
- Considera usar HTTPS en producción

## 📞 Soporte

Si tienes problemas, verifica:

1. ✅ MySQL está corriendo en puerto 3306
2. ✅ Las credenciales en `.env` son correctas
3. ✅ El backend está corriendo en puerto 3004
4. ✅ Las dependencias están instaladas (`npm install`)
5. ✅ La base de datos `smartbee` existe y tiene datos

## 🎉 ¡Listo!

Tu aplicación SmartBee ahora está corriendo con:
- ✅ Backend en puerto **3004**
- ✅ Frontend servido desde el mismo puerto en producción
- ✅ MySQL en puerto **3306**
- ✅ Arquitectura unificada y lista para desplegar