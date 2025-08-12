#ifndef _SMARTBEE_MODO_NORMAL_H_
#define _SMARTBEE_MODO_NORMAL_H_

#include <WiFi.h>

#define conn_setCACert()
#define conn_connect() conn.connect(SMARTBEE_MQTT_SERVER, SMARTBEE_MQTT_PORT, 5000)
#define conn_connected() conn.connected()
#define conn_loop()
#define conn_stop() conn.stop()

WiFiClient conn;

#endif  // _SMARTBEE_MODO_NORMAL_H_