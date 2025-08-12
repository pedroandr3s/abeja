# Configuración para programar los nodos

Toda la configuración debe realizarse en el archivo "Config.h" en

```cpp
// --- INICIO CONFIGURACION ---
#define SMARTBEE_DEBUG 1                     // Modo depuración.  0 = debug desactivado, 1 = debug activado
#define SMARTBEE_MQTT_SERVER "smartbee.cl"   // direccion IP del servidor MQTT (o websocket)
#define SMARTBEE_MQTT_PORT SMARTBEE_MQTT_TLS // seleccionar SMARTBEE_MQTT_NML, SMARTBEE_MQTT_TLS o SMARTBEE_MQTT_WSS
#define SMARTBEE_WIFI_SSID "ID Wifi"         // Nombre de la wifi
#define SMARTBEE_WIFI_PASS "Clave Wifi"      // Clave de la wifi
#define SMARTBEE_MQTT_NODE "ID nodo"         // ID del nodo autorizado a publicar
#define SMARTBEE_MQTT_PASS "Clave nodo"      // Clavel del nodo autorizado para publicar
#define SMARTBEE_LOADCELL_ENABLED 1          // establece si se incluye o no el modulo de peso. 0 = no, 1= si
#define SMARTBEE_LOADCELL_CALIBRATION 2280.f // resultado de la calibración
// --- FIN CONFIGURACION ---
```

Para los nodos de la colmena se debe especificar (habilita la lectura de la balanza)

```cpp
#define SMARTBEE_LOADCELL_ENABLED 1
```

Para los nodos ambientales se debe especificar

```cpp
#define SMARTBEE_LOADCELL_ENABLED 0
```

## IDE de Arduino

Si se va a utilizar la IDE de Arduino entonces se debe configurar lo siguiente:

| Parámetro             | Valor             |
|-----------------------|-------------------|
| Board                 | ESP32 Dev Module  |
|CPU frequency          |  240MHz           |
|Core Debug Level       |  None             |
|Erase all flash before |  enabled          |
|Events run on          |  Core 1           |
|Flash Frequency        |  80MHz            |
|Flash Mode             |  QIO              |
|Flash Size             |  4MB              |
|JTag adapter           |  disabled         |
|Arduin runs on         |  Core 1           |
|Partition Schema       |  Huge APP         |
|PSRAM                  |  disabled         |
|Upload Speed           |  921600           |
|ZeegBee mode           |  disabled         |

## PlatformIO

Si se va a utilizar ` platformio ` en el directorio ya se encuentra el archivo ` platformio.ini ` requerido por lo que su use es directo a través de la extensión.
