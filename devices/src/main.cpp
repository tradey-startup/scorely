#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <LittleFS.h>
#include <ArduinoJson.h>

// --- Prototipi delle funzioni ---
void connectWiFi();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handlePairingResponse(String jsonPayload);
void savePairingToFlash();
void loadPairingFromFlash();
void handleButtons();
void requestPairing();
void sendScoreEvent(String action);
void blinkLED(int times, int delayMs);
// --------------------------------

const char* ssid = "castelli_wifi";
const char* password = "zID1M16YZdnZ";

const char* mqtt_server = "25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_user = "admin";
const char* mqtt_pass = "Scorely_test1";

#define BTN_PLUS_PIN 25
#define BTN_MINUS_PIN 26
#define LED_PIN 2

const int DEBOUNCE_DELAY = 50;
const int PAIRING_PRESS_DURATION = 2000;

WiFiClientSecure espClient;
PubSubClient client(espClient);

String deviceId;
String sessionTopic = "";
int teamNumber = 0;
bool isPaired = false;

unsigned long lastPlusPress = 0;
unsigned long lastMinusPress = 0;
bool plusPressed = false;
bool minusPressed = false;
unsigned long bothPressedStart = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  pinMode(BTN_PLUS_PIN, INPUT_PULLUP);
  pinMode(BTN_MINUS_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);

  Serial.println("\n=== ESP32 Bracelet Starting ===");

  if (!LittleFS.begin(true)) {
    Serial.println("Error mounting LittleFS");
    return;
  }
  Serial.println("LittleFS mounted successfully");

  deviceId = "bracelet_" + String((uint32_t)ESP.getEfuseMac(), HEX);
  Serial.println("Device ID: " + deviceId);

  loadPairingFromFlash();

  connectWiFi();

  espClient.setInsecure();
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);

  connectMQTT();

  Serial.println("Setup complete!");
  blinkLED(3, 200);
}

void loop() {
  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  handleButtons();
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

void connectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT broker...");

    if (client.connect(deviceId.c_str(), mqtt_user, mqtt_pass)) {
      Serial.println("connected!");

      if (isPaired) {
        Serial.println("Already paired, ready to send events");
        blinkLED(2, 100);
      } else {
        Serial.println("Not paired yet, waiting for pairing request");
        String responseTopic = "pairing/response/" + deviceId;
        client.subscribe(responseTopic.c_str());
        Serial.println("Subscribed to: " + responseTopic);
      }
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 seconds");
      delay(2000);
    }
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message on topic: ");
  Serial.println(topic);

  String message = "";
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println("Payload: " + message);

  String topicStr = String(topic);
  if (topicStr.startsWith("pairing/response/")) {
    handlePairingResponse(message);
  }
}

void handlePairingResponse(String jsonPayload) {
  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, jsonPayload);

  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  String status = doc["status"];
  if (status == "ok") {
    sessionTopic = doc["topic"].as<String>();
    teamNumber = doc["team"];

    Serial.println("Pairing successful!");
    Serial.println("Session topic: " + sessionTopic);
    Serial.println("Team: " + String(teamNumber));

    savePairingToFlash();
    isPaired = true;

    blinkLED(5, 100);
  } else {
    Serial.println("Pairing failed!");
    blinkLED(10, 50);
  }
}

void savePairingToFlash() {
  File file = LittleFS.open("/pairing.json", "w");
  if (!file) {
    Serial.println("Failed to open file for writing");
    return;
  }

  JsonDocument doc;
  doc["sessionTopic"] = sessionTopic;
  doc["teamNumber"] = teamNumber;

  serializeJson(doc, file);
  file.close();
  Serial.println("Pairing saved to flash");
}

void loadPairingFromFlash() {
  if (!LittleFS.exists("/pairing.json")) {
    Serial.println("No pairing found in flash");
    return;
  }

  File file = LittleFS.open("/pairing.json", "r");
  if (!file) {
    Serial.println("Failed to open pairing file");
    return;
  }

  JsonDocument doc;
  DeserializationError error = deserializeJson(doc, file);
  file.close();

  if (error) {
    Serial.print("Failed to parse pairing: ");
    Serial.println(error.c_str());
    return;
  }

  sessionTopic = doc["sessionTopic"].as<String>();
  teamNumber = doc["teamNumber"];
  isPaired = true;

  Serial.println("Pairing loaded from flash");
  Serial.println("Session topic: " + sessionTopic);
  Serial.println("Team: " + String(teamNumber));
}

void handleButtons() {
  bool plusState = digitalRead(BTN_PLUS_PIN) == LOW;
  bool minusState = digitalRead(BTN_MINUS_PIN) == LOW;

  if (plusState && minusState) {
    if (!plusPressed || !minusPressed) {
      bothPressedStart = millis();
      plusPressed = true;
      minusPressed = true;
    }

    if (millis() - bothPressedStart >= PAIRING_PRESS_DURATION) {
      requestPairing();
      bothPressedStart = millis() + 10000;
    }
  } else {
    if (plusPressed && !plusState) {
      if (millis() - lastPlusPress > DEBOUNCE_DELAY) {
        if (!minusPressed && isPaired) {
          sendScoreEvent("increment");
        }
        lastPlusPress = millis();
      }
      plusPressed = false;
    }

    if (minusPressed && !minusState) {
      if (millis() - lastMinusPress > DEBOUNCE_DELAY) {
        if (!plusPressed && isPaired) {
          sendScoreEvent("decrement");
        }
        lastMinusPress = millis();
      }
      minusPressed = false;
    }

    if (plusState && !plusPressed) {
      plusPressed = true;
    }
    if (minusState && !minusPressed) {
      minusPressed = true;
    }
  }
}

void requestPairing() {
  Serial.println("\n=== PAIRING REQUEST ===");

  JsonDocument doc;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  if (client.publish("pairing/request", payload.c_str())) {
    Serial.println("Pairing request sent!");
    Serial.println("Payload: " + payload);
    blinkLED(3, 300);
  } else {
    Serial.println("Failed to send pairing request");
  }
}

void sendScoreEvent(String action) {
  if (!isPaired || sessionTopic == "") {
    Serial.println("Not paired, cannot send event");
    return;
  }

  JsonDocument doc;
  doc["type"] = "score";
  doc["action"] = action;
  doc["team"] = teamNumber;
  doc["deviceId"] = deviceId;
  doc["timestamp"] = millis();

  String payload;
  serializeJson(doc, payload);

  if (client.publish(sessionTopic.c_str(), payload.c_str())) {
    Serial.println("Event sent: " + action + " for team " + String(teamNumber));
    blinkLED(1, 50);
  } else {
    Serial.println("Failed to send event");
  }
}

void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(delayMs);
    digitalWrite(LED_PIN, LOW);
    delay(delayMs);
  }
}
