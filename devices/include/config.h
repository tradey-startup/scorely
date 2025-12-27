#ifndef CONFIG_H
#define CONFIG_H

// WiFi Configuration
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define WIFI_TIMEOUT_MS 20000

// BLE Configuration
#define BLE_DEVICE_NAME "ESP32-Scorely"
#define BLE_SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define BLE_CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

// Serial Configuration
#define SERIAL_BAUD_RATE 115200

// Pin Definitions (example)
#define LED_PIN 2
#define BUTTON_PIN 0

#endif // CONFIG_H
