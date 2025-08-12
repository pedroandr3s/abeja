#ifndef _SMARTBEE_MODO_TLS_H_
#define _SMARTBEE_MODO_TLS_H_

#include <WiFiClientSecure.h>
#include "CACert.h"

#define conn_setCACert() conn.setCACert(ca_cert)
#define conn_connect() conn.connect(SMARTBEE_MQTT_SERVER, SMARTBEE_MQTT_PORT, 5000)
#define conn_connected() conn.connected()
#define conn_loop()
#define conn_stop() conn.stop()

WiFiClientSecure conn;

#endif  // _SMARTBEE_MODO_TLS_H_