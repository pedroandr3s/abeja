# SmartBee 🐝

* Santo Tomas Chillan x Ingenieria en informatica x Tec Agricola *

SmartBee es una plataforma IoT diseñada para la monitorización remota y en tiempo real de colmenas apícolas, orientada a optimizar la gestión y el cuidado de las abejas.
El sistema integra sensores de temperatura, humedad y peso, que permiten recopilar datos clave sobre las condiciones internas de la colmena y el estado de la colonia.

Estos datos se transmiten de forma inalámbrica a la nube, donde son procesados y visualizados en una interfaz web y/o aplicación móvil. De esta manera, los apicultores pueden detectar cambios anormales —como variaciones bruscas de temperatura, humedad inadecuada o pérdida de peso— que podrían indicar problemas de salud, falta de alimento o riesgo de enjambrazón.

El objetivo de SmartBee es facilitar una apicultura más eficiente, sostenible y basada en datos, reduciendo las visitas innecesarias al apiario, mejorando la productividad y contribuyendo a la conservación de las abejas.
📦 Instalación y ejecución del proyecto

## 🚀 1. Requisitos previos

Antes de comenzar asegúrate de tener instalado:

- Node.js (v18 o superior recomendado)
- npm (incluido con Node.js)
- MySQL (para la base de datos)
- Arduino IDE (para la programación de microcontroladores)
- Git (para clonar el repositorio)



## 🎨 3. Frontend (React + Tailwind + Chart.js)

### 📥 Instalación de dependencias

Dentro de la carpeta Aplicacion, ejecuta:

```
	npm install

```



### ▶️ Ejecución de Aplicacion

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
	
```

### ▶️ Ejecución de prueba (Despues puede volver al Store original)

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

