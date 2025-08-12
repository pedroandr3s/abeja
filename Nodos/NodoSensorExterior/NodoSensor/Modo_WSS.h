#ifndef _SMARTBEE_MODO_WSS_H_
#define _SMARTBEE_MODO_WSS_H_

#include <WebSocketsClient_Generic.h>  // WebSockets_Generic by Markus Sattler y Khoi Hoang, 2.16.1
#include "CACert.h"

#define conn_setCACert()
//#define conn_connect()
#define conn_connected() conn.isConnected()
#define conn_loop() conn.loop()
#define conn_stop() conn.disconnect()

WebSocketsClient conn;

// esto es asincronico
void conn_connect() {
  conn.beginSslWithCA(SMARTBEE_MQTT_SERVER, SMARTBEE_MQTT_PORT, SMARTBEE_MQTT_WSS_PATH, ca_cert, "mqtt");
  unsigned long t = millis();
  while (millis() - t < 5000) {
    conn.loop();
    if (conn.isConnected()) break;
  }
}

#endif  // _SMARTBEE_MODO_WSS_H_