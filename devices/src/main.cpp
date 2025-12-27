#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* ssid = "castelli_wifi";
const char* password = "zID1M16YZdnZ";

const char* mqtt_server = "25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "admin";
const char* mqtt_pass = "Scorely_test1";

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup() {
//   Serial.begin(115200);
//   WiFi.begin(ssid, password);
//   while(WiFi.status() != WL_CONNECTED) delay(500);

//   espClient.setInsecure(); // per TLS senza certificati
//   client.setServer(mqtt_server, mqtt_port);
}

void loop() {
//   if (!client.connected()) {
//     while (!client.connected()) {
//       Serial.println("Connessione al broker...");
//       if(client.connect("ESP32Bracelet", mqtt_user, mqtt_pass)) {
//         Serial.println("Connesso!");
//       } else {
//         delay(2000);
//       }
//     }
//   }
//   client.loop();

//   // invio esempio
//   client.publish("session/ABC123/state", "{\"team1\":1,\"team2\":0}");
//   delay(5000);
}
