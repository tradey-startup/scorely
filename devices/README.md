# ESP32 Scorely Device

Progetto PlatformIO per ESP32 DevKit V1 con supporto WiFi e Bluetooth Low Energy (BLE).

## Requisiti

- [PlatformIO IDE](https://platformio.org/install/ide?install=vscode) (installato)
- ESP32 DevKit V1
- Cavo USB per la programmazione

## Struttura del Progetto

```
devices/
├── platformio.ini          # Configurazione PlatformIO
├── src/
│   └── main.cpp           # File principale con WiFi e BLE
├── include/
│   └── config.h           # Configurazioni e costanti
├── lib/                   # Librerie personalizzate
├── test/                  # Test unitari
└── README.md             # Questo file
```

## Configurazione

### 1. Credenziali WiFi

Modifica il file `src/main.cpp` o `include/config.h` e inserisci le tue credenziali WiFi:

```cpp
const char* WIFI_SSID = "TUO_SSID";
const char* WIFI_PASSWORD = "TUA_PASSWORD";
```

### 2. Configurazione BLE

Il device viene inizializzato con il nome "ESP32-Scorely" e un UUID di servizio predefinito. Puoi modificare questi valori in `include/config.h`.

## Compilazione e Upload

### Da PlatformIO IDE (VSCode)

1. Apri la cartella `devices` in VSCode
2. Clicca sull'icona PlatformIO nella barra laterale
3. Seleziona `Build` per compilare il progetto
4. Seleziona `Upload` per caricare il firmware sull'ESP32
5. Seleziona `Monitor` per visualizzare l'output seriale

### Da Riga di Comando

```bash
cd devices

# Compila il progetto
pio run

# Carica il firmware
pio run --target upload

# Apri il monitor seriale
pio device monitor

# Compila, carica e apri il monitor in un comando
pio run --target upload && pio device monitor
```

## Funzionalità

### WiFi

Il dispositivo si connette automaticamente alla rete WiFi configurata all'avvio. Controlla il monitor seriale per vedere l'indirizzo IP assegnato.

### Bluetooth Low Energy (BLE)

Il dispositivo crea un server BLE con:
- Nome dispositivo: "ESP32-Scorely"
- Service UUID: `4fafc201-1fb5-459e-8fcc-c5c9c331914b`
- Characteristic UUID: `beb5483e-36e1-4688-b7f5-ea07361b26a8`

La caratteristica supporta:
- READ: Lettura di valori
- WRITE: Scrittura di valori
- NOTIFY: Notifiche ai client connessi
- INDICATE: Indicazioni ai client connessi

### Monitor Seriale

Velocità: 115200 baud

Il dispositivo invia informazioni di debug sulla porta seriale, inclusi:
- Stato della connessione WiFi
- Indirizzo IP
- Eventi BLE (connessione/disconnessione client)
- Dati ricevuti via BLE

## Pin Definitions

I pin sono definiti in `include/config.h`:

- `LED_PIN`: GPIO 2 (LED integrato)
- `BUTTON_PIN`: GPIO 0 (pulsante BOOT)

## Troubleshooting

### Il device non si connette al WiFi

- Verifica le credenziali WiFi
- Assicurati che la rete WiFi sia a 2.4 GHz (ESP32 non supporta 5 GHz)
- Controlla il monitor seriale per eventuali errori

### Upload fallito

- Verifica che il cavo USB sia collegato correttamente
- Premi il pulsante BOOT durante l'upload se richiesto
- Controlla che la porta COM/seriale sia corretta

### Il monitor seriale non mostra nulla

- Verifica che la velocità del monitor sia impostata a 115200 baud
- Premi il pulsante RESET sull'ESP32

## Prossimi Passi

- Aggiungere sensori (I2C, SPI)
- Implementare OTA (Over-The-Air) updates
- Creare API REST per comunicazione WiFi
- Salvare configurazioni in memoria non volatile (NVS/SPIFFS)
- Implementare deep sleep per risparmio energetico

## Risorse Utili

- [Documentazione PlatformIO](https://docs.platformio.org/)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [ESP32 BLE Arduino](https://github.com/nkolban/ESP32_BLE_Arduino)
- [Espressif Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/)
