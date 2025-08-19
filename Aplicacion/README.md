# SmartBee 🐝

* Santo Tomas Chillan x Ingenieria en informatica x Tec Agricola *

SmartBee es una plataforma IoT diseñada para la monitorización remota y en tiempo real de colmenas apícolas, orientada a optimizar la gestión y el cuidado de las abejas.
El sistema integra sensores de temperatura, humedad y peso, que permiten recopilar datos clave sobre las condiciones internas de la colmena y el estado de la colonia.

Estos datos se transmiten de forma inalámbrica a la nube, donde son procesados y visualizados en una interfaz web y/o aplicación móvil. De esta manera, los apicultores pueden detectar cambios anormales —como variaciones bruscas de temperatura, humedad inadecuada o pérdida de peso— que podrían indicar problemas de salud, falta de alimento o riesgo de enjambrazón.

El objetivo de SmartBee es facilitar una apicultura más eficiente, sostenible y basada en datos, reduciendo las visitas innecesarias al apiario, mejorando la productividad y contribuyendo a la conservación de las abejas.
📦 Instalación y ejecución del proyecto
Backend


## 🚀 1. Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- Node.js (v18 o superior recomendado)
- npm (incluido con Node.js)
- MySQL (para la base de datos)
- Arduino IDE (para la programación de microcontroladores)
- Git (para clonar el repositorio)

---

## ⚙️ 2. Backend (API con Node.js + Express)

### 📥 Instalación de dependencias

Dentro de la carpeta del backend, ejecuta:

```
	npm install bcryptjs@^2.4.3
	npm install cors@^2.8.5
	npm install dotenv@^16.6.1
	npm install express@^4.21.2
	npm install express-rate-limit@^6.11.2
	npm install helmet@^7.2.0
	npm install jsonwebtoken@^9.0.2
	npm install mysql2@^3.14.1
	npm install --save-dev nodemon@^3.1.10
```

### ▶️ Ejecución del servidor

```
	node server.js
```

Si prefieres desarrollo con autoreload:

```
	npx nodemon server.js
```

---

## 🎨 3. Frontend (React + Tailwind + Chart.js)

### 📥 Instalación de dependencias

Dentro de la carpeta del frontend, ejecuta:

```
	npm install
	npm install @fortawesome/free-solid-svg-icons@^6.7.2
	npm install @fortawesome/react-fontawesome@^0.2.2
	npm install @testing-library/dom@^10.4.0
	npm install @testing-library/jest-dom@^6.6.3
	npm install @testing-library/react@^16.3.0
	npm install @testing-library/user-event@^13.5.0
	npm install axios@^1.10.0
	npm install chart.js@^4.5.0
	npm install lucide-react@^0.525.0
	npm install react@^19.1.0
	npm install react-chartjs-2@^5.3.0
	npm install react-dom@^19.1.0
	npm install react-router-dom@^7.7.1
	npm install react-scripts@5.0.1
	npm install web-vitals@^2.1.4
```

Dependencias de desarrollo:

```
	npm install --save-dev @eslint/compat@^1.3.1
	npm install --save-dev @tailwindcss/postcss@^4.1.11
	npm install --save-dev autoprefixer@^10.4.21
	npm install --save-dev postcss@^8.5.6
	npm install --save-dev react-app-rewired@^2.2.1
	npm install --save-dev tailwindcss@^4.1.11
```

### ▶️ Ejecución del frontend

```
	npm start
```

Esto levantará el proyecto en modo desarrollo en `http://localhost:3000`.

---

## 📦 4. Store & Alert (Módulo de Almacenamiento y Alertas)

### 📥 Instalación de dependencias

Dentro de la carpeta `Store_And_Alert`, ejecuta:

```
	npm install
	npm install mqtt@^5.13.1
	npm install mysql2@^3.14.1
	npm install uuid@^11.1.0
```

### ▶️ Ejecución

```
	node Store_and_Alert.js
```

En caso de que tenga un frontend asociado:

```
	npm start
```

---

## 🔧 5. Arduino (Sensores)

Para el apartado de los **sensores de peso** es necesario realizar una **calibración correcta** antes de usarlos.  

### 📚 Librerías utilizadas en Arduino

(⚠️ Aquí deberías agregar la lista exacta de librerías, por ejemplo:)
- HX711 (para celdas de carga)
- DHT (para temperatura y humedad)
- WiFi.h o WiFiNINA.h (según módulo WiFi)
- PubSubClient (para conexión MQTT)

### ⚡ Características principales del sistema

- 📡 Monitorización en tiempo real de **temperatura, humedad y peso**.  
- ☁️ Almacenamiento de datos en la nube con acceso seguro.  
- 🔔 Alertas automáticas ante valores críticos (ej. exceso de peso, temperatura fuera de rango).  
- 📊 Visualización en gráficos interactivos desde el frontend.  

<img width="1467" height="796" alt="Captura de pantalla 2025-08-14 a la(s) 17 07 16" src="https://github.com/user-attachments/assets/02887cf3-cb50-4968-b17d-2e2fab0ac1c4" />

# Estas colmenas se encuentran ubicadas en Bulnes y Quillón (Region de Ñuble 🇨🇱)

![IMG_1183](https://github.com/user-attachments/assets/c4168fdc-65d8-4565-8bb8-a3dc326848e6)

![IMG_1187](https://github.com/user-attachments/assets/a03a2196-50f8-4fcf-a96e-681a2edbbd22)

![IMG_1196](https://github.com/user-attachments/assets/5b05ef5b-07a6-42a6-ba7e-44e9575b4cec)



