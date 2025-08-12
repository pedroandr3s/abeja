#include <WiFi.h>

// configurar en Config.h
#include "Config.h"

// requerido para activar o desactivar el debug
#include "debug.h"

// conexión normal
#if SMARTBEE_MQTT_PORT == SMARTBEE_MQTT_NML
#include "Modo_Normal.h"

// conexión sobre TLS
#elif SMARTBEE_MQTT_PORT == SMARTBEE_MQTT_TLS
#include "Modo_TLS.h"

// conexión sobre Websocket y TLS
#elif SMARTBEE_MQTT_PORT == SMARTBEE_MQTT_WSS
#include "Modo_WSS.h"

// otro caso es un error
#else
#error Debe especificar SMARTBEE_MQTT_PORT con un valor correcto
#endif

// MQTT
#include <MQTTPubSubClient_Generic.h>  // MQTTPubSubClient_Generic by hideakitai y Khoi Hoang, 1.2.1
MQTTPubSub::PubSubClient<1024> mqtt;

// JSON
#include <ArduinoJson.h>  // ArduinoJson by Benoit Blancho, 7.4.2
JsonDocument jsonDoc;

// DHT22 -- sensor de humedad y temperatura
#include "DHT.h"
DHT dht(SMARTBEE_DHT_PIN_DATA, DHT22);

// HX711 -- amplificador para celdas de carga
#if SMARTBEE_LOADCELL_ENABLED == 1
#include "HX711.h"
HX711 scale;
#endif

// internas
bool initWIFI();
bool initMQTT();
void my_loop(unsigned long);

char buffer[512];

void setup() {
  dbgInit(115200);
  dbgPrint("\n\n");

  dht.begin();

#if SMARTBEE_LOADCELL_ENABLED == 1
  scale.begin(SMARTBEE_LOADCELL_DOUT_PIN, SMARTBEE_LOADCELL_SCK_PIN, SMARTBEE_LOADCELL_CHANNEL_A);
  scale.set_scale(SMARTBEE_LOADCELL_CALIBRATION);
  scale.tare();
  scale.power_up();
  scale.wait_ready_timeout(1000);
#endif

  if (!initWIFI()) {
    dbgPrint("Error en conexión WiFi.\n");
    return;
  }

  if (!initMQTT()) {
    dbgPrint("Error en conexión MQTT.\n");
    return;
  }
}

void loop() {
  // asegurarse de que sigue conectado al MQTT
  if (!mqtt.isConnected()) {
    dbgPrint("Reconectando al servidor MQTT...\n");
    if (!initMQTT()) {
      dbgPrint("Fallo al reconectar MQTT.\n");
      delay(5000);
      return;
    }
  }

  // necesario
  my_loop(200);

  // nuestro ID
  jsonDoc["nodo_id"] = SMARTBEE_MQTT_NODE;

  // lectura del DHT22
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  jsonDoc["temperatura"] = isnan(temperature) ? -99999 : temperature;
  jsonDoc["humedad"] = isnan(humidity) ? -99999 : humidity;

#if SMARTBEE_LOADCELL_ENABLED == 1
  long peso = scale.is_ready() ? scale.get_units(5) : -99999;
  jsonDoc["peso"] = peso;
#endif

  // serialización
  serializeJson(jsonDoc, buffer);
  dbgPrint(buffer);
  dbgPrint("\n");

  // publicación
  if (!mqtt.publish(SMARTBEE_MQTT_TOPIC, buffer, false, 2)) {
    dbgPrint("Error al Publicar\n");
  }

  // tiempo de espera entre envíos (Equivalente a 30 minutos)
  delay(1800000);
}

bool initWIFI() {
  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(SMARTBEE_WIFI_SSID, SMARTBEE_WIFI_PASS);

  dbgPrint("Conectando a la WiFi (");
  dbgPrint(SMARTBEE_WIFI_SSID);
  dbgPrint("): .");
  for (int i = 0; i < 10; i++) {
    if (WiFi.status() == WL_CONNECTED) {
      dbgPrint(" Ok\n");
      return true;
    }
    dbgPrint(".");
    delay(1000);
  }
  dbgPrint(" Error al intentar conectar\n");
  return false;
}

bool initMQTT() {
  conn_setCACert();
  mqtt.begin(conn);
  mqtt.setTimeout(5000);

  dbgPrint("Conectando a Servidor (");
  dbgPrint(SMARTBEE_MQTT_SERVER);
  dbgPrint(":");
  dbgPrint(SMARTBEE_MQTT_PORT);
  dbgPrint("): .");

  for (int i = 0; i < 3; i++) {
    conn_connect();
    my_loop(200);
    if (conn_connected()) {
      dbgPrint(" Ok\n");
      break;
    }
    dbgPrint(".");
  }

  if (!conn_connected()) {
    dbgPrint(" Error al intentar conectar\n");
    return false;
  }

  dbgPrint("Accediendo al Servicio MQTT: .");
  for (int i = 0; i < 5; i++) {
    my_loop(200);
    if (mqtt.connect(SMARTBEE_MQTT_CLIENTID, SMARTBEE_MQTT_NODE, SMARTBEE_MQTT_PASS)) {
      dbgPrint(" Ok\n");
      return true;
    }
    dbgPrint(".");
  }

  conn_stop();
  my_loop(500);
  dbgPrint(" Error al intentar acceder\n");
  return false;
}

void my_loop(unsigned long t) {
  unsigned long t0 = millis();
  while (millis() - t0 < t) {
    conn_loop();
    if (mqtt.isConnected()) mqtt.update();
    delay(10);
  }
}
