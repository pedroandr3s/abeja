#ifndef _SMARTBEE_DEBUG_H
#define _SMARTBEE_DEBUG_H

// sin debug
#if SMARTBEE_DEBUG == 0
#define deepSleepOnSuccess() esp_deep_sleep(SMARTBEE_SLEEP_US_NORMAL)
#define deepSleepOnError() esp_deep_sleep(SMARTBEE_SLEEP_US_ERROR)

#define dbgInit(n)
#define dbgPrint(p)

// con debug
#else
#define deepSleepOnSuccess() esp_deep_sleep(SMARTBEE_SLEEP_US_DEBUG)
#define deepSleepOnError() esp_deep_sleep(SMARTBEE_SLEEP_US_DEBUG)

#define dbgInit(n) { Serial.begin(n); while (!Serial) delay(50); }
#define dbgPrint(p) { Serial.print(p); Serial.flush(); }
#endif

#endif  // _SMARTBEE_DEBUG_H