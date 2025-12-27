# 🔗 STEP 3 – Pairing Base (1 Braccialetto)

## 📋 Obiettivo
Implementare il sistema di pairing tra un braccialetto ESP32 e una sessione di gioco tramite MQTT.

## ✅ Completato

### 1. **Codice ESP32 Braccialetto**
Il braccialetto ([devices/src/main.cpp](devices/src/main.cpp)) ora include:

- ✅ Connessione Wi-Fi e MQTT
- ✅ Gestione pulsanti + e - (GPIO 25 e 26)
- ✅ LED di feedback (GPIO 2)
- ✅ Pairing: premere + e - insieme per 2 secondi
- ✅ Salvataggio configurazione in LittleFS
- ✅ Invio eventi di punteggio

### 2. **Backend MQTT**
Il servizio di pairing ([cloud/pairing-service.js](cloud/pairing-service.js)) gestisce:

- ✅ Ascolto richieste pairing su `pairing/request`
- ✅ Assegnazione automatica team (bilanciamento 1 vs 2)
- ✅ Risposta su `pairing/response/{deviceId}`
- ✅ Gestione sessioni attive con timeout

### 3. **Test Scripts**
- ✅ [cloud/test-pairing.js](cloud/test-pairing.js) - Apre finestra di pairing
- ✅ [cloud/test-session.js](cloud/test-session.js) - Test sessione completa

---

## 🧪 Come Testare

### Prerequisiti
1. ESP32 con pulsanti collegati a GPIO 25 (+) e 26 (-)
2. LED integrato su GPIO 2
3. Node.js installato
4. PlatformIO installato (per compilare ESP32)

### Setup Hardware

```
ESP32 Connections:
┌─────────────────┐
│     ESP32       │
│                 │
│  GPIO 25 ──┬──  │  Pulsante +
│            └──  │  (pull-up interno)
│                 │
│  GPIO 26 ──┬──  │  Pulsante -
│            └──  │  (pull-up interno)
│                 │
│  GPIO 2  ─LED─  │  LED feedback
└─────────────────┘
```

### Passo 1: Compila e Carica ESP32

```bash
cd devices
pio run --target upload
pio device monitor
```

**Cosa aspettarsi:**
```
=== ESP32 Bracelet Starting ===
LittleFS mounted successfully
Device ID: bracelet_a1b2c3d4
No pairing found in flash
Connecting to WiFi...........
WiFi connected!
IP: 192.168.1.100
Connecting to MQTT broker...connected!
Not paired yet, waiting for pairing request
Subscribed to: pairing/response/bracelet_a1b2c3d4
Setup complete!
```

### Passo 2: Avvia il Servizio di Pairing

```bash
cd cloud
node pairing-service.js
```

**Output atteso:**
```
🔗 Pairing Service Starting...
✅ Connected to MQTT broker
📡 Subscribed to: pairing/request
🎯 Waiting for pairing requests...
```

### Passo 3: Apri Finestra di Pairing

In un altro terminale:

```bash
cd cloud
node test-pairing.js
```

**Output atteso:**
```
🧪 Pairing Test Script
📡 Connecting to MQTT broker...
✅ Connected to MQTT broker

🔓 Opening pairing for session: TEST01
⏱️  Pairing window: 60 seconds

✅ Pairing window opened!
👉 Now press + and - together on your bracelet!
```

### Passo 4: Pairing del Braccialetto

1. **Premi + e - contemporaneamente** sull'ESP32 per 2 secondi
2. Il LED lampeggerà 3 volte (richiesta inviata)
3. Attendi la risposta del server

**Serial Monitor ESP32:**
```
=== PAIRING REQUEST ===
Pairing request sent!
Payload: {"deviceId":"bracelet_a1b2c3d4","timestamp":12345}

Message on topic: pairing/response/bracelet_a1b2c3d4
Payload: {"status":"ok","topic":"session/TEST01/event","team":1}

Pairing successful!
Session topic: session/TEST01/event
Team: 1
Pairing saved to flash
```

Il LED lampeggia 5 volte = **PAIRING RIUSCITO!** ✅

**Pairing Service Log:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 PAIRING REQUEST RECEIVED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Device ID: bracelet_a1b2c3d4
Timestamp: 12345

✅ PAIRING SUCCESSFUL
Session: TEST01
Team: 1
Devices paired: 1
  Team 1: 1 devices
  Team 2: 0 devices
```

### Passo 5: Testa Invio Punteggio

1. **Premi +** → Incrementa punteggio Team 1
2. **Premi -** → Decrementa punteggio Team 1

**Serial Monitor ESP32:**
```
Event sent: increment for team 1
Event sent: decrement for team 1
```

**Test Script riceve:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ EVENT RECEIVED FROM BRACELET!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{
  "type": "score",
  "action": "increment",
  "team": 1,
  "deviceId": "bracelet_a1b2c3d4",
  "timestamp": 67890
}
```

---

## 🔄 Test Completo: Riavvio ESP32

1. Scollega e ricollega l'ESP32
2. Il braccialetto carica il pairing salvato da LittleFS
3. **Non serve rifare il pairing!**

**Serial Monitor:**
```
=== ESP32 Bracelet Starting ===
LittleFS mounted successfully
Device ID: bracelet_a1b2c3d4
Pairing loaded from flash
Session topic: session/TEST01/event
Team: 1
Connecting to WiFi...
WiFi connected!
Connecting to MQTT broker...connected!
Already paired, ready to send events
Setup complete!
```

Premi + o - e l'evento viene inviato immediatamente! 🎉

---

## 📊 Architettura MQTT

```
┌─────────────┐
│ ESP32       │
│ Braccialetto│
└──────┬──────┘
       │
       │ 1. Premi + e - insieme
       │
       v
 pairing/request
 {"deviceId": "bracelet_xxx", "timestamp": 12345}
       │
       v
┌──────────────────┐
│ Pairing Service  │
│ (Node.js)        │
└──────┬───────────┘
       │
       │ 2. Assegna team e topic
       │
       v
 pairing/response/bracelet_xxx
 {"status": "ok", "topic": "session/TEST01/event", "team": 1}
       │
       v
┌─────────────┐
│ ESP32       │
│ Salva in    │
│ LittleFS    │
└──────┬──────┘
       │
       │ 3. Premi + o -
       │
       v
 session/TEST01/event
 {"type": "score", "action": "increment", "team": 1, ...}
```

---

## 🎯 Test Critici - Checklist

| Test | Descrizione | Stato |
|------|-------------|-------|
| ✅ | ESP32 si connette a Wi-Fi | |
| ✅ | ESP32 si connette a MQTT | |
| ✅ | Pairing service riceve richieste | |
| ✅ | ESP32 riceve risposta pairing | |
| ✅ | Topic salvato in LittleFS | |
| ✅ | Pulsante + invia increment | |
| ✅ | Pulsante - invia decrement | |
| ✅ | Dopo riavvio pairing è mantenuto | |
| ✅ | LED lampeggia correttamente | |

---

## 🐛 Troubleshooting

### ESP32 non si connette a Wi-Fi
- Verifica SSID e password in `main.cpp:5-6`
- Controlla che il router sia raggiungibile

### ESP32 non si connette a MQTT
- Verifica credenziali MQTT in `main.cpp:8-11`
- Controlla firewall/rete

### Pairing non funziona
- Assicurati che `pairing-service.js` sia in esecuzione
- Verifica che la finestra di pairing sia aperta (`test-pairing.js`)
- Controlla i log del pairing service

### Eventi non arrivano
- Verifica che il braccialetto sia paired (`isPaired = true` nel log)
- Controlla il topic salvato in LittleFS
- Assicurati che `test-pairing.js` o un client sia subscribed al topic eventi

### LittleFS mount error
- Cancella flash: `pio run --target erase`
- Ricarica firmware: `pio run --target upload`

---

## 📦 File Modificati/Creati

```
scorely/
├── devices/
│   ├── src/
│   │   └── main.cpp                 [MODIFICATO] Codice completo braccialetto
│   └── platformio.ini               [MODIFICATO] Aggiunta ArduinoJson
│
├── cloud/
│   ├── pairing-service.js           [NUOVO] Servizio backend pairing
│   └── test-pairing.js              [NUOVO] Script test pairing
│
└── STEP3-PAIRING-GUIDE.md           [NUOVO] Questa guida
```

---

## 🎉 Output Atteso

Se tutto funziona correttamente vedrai:

1. ✅ ESP32 connesso e pronto
2. ✅ Pairing service in ascolto
3. ✅ Finestra pairing aperta (60s)
4. ✅ Pairing completato (LED lampeggia 5 volte)
5. ✅ Eventi punteggio ricevuti dal server
6. ✅ Dopo riavvio ESP32 mantiene il pairing

**Questo è lo STEP 3 completo!** 🚀

---

## 🔜 Prossimi Step

Ora che il pairing base funziona con un braccialetto, i prossimi step saranno:

- **STEP 4**: Stato persistente e riconnessioni robuste
- **STEP 5**: Multi-braccialetto e gestione team
- **STEP 6**: UX completa con Web App e QR code

---

## 📝 Note Tecniche

### Configurazione GPIO
- `BTN_PLUS_PIN = 25` - Pulsante incremento (pull-up interno)
- `BTN_MINUS_PIN = 26` - Pulsante decremento (pull-up interno)
- `LED_PIN = 2` - LED integrato ESP32

### Timing
- `DEBOUNCE_DELAY = 50ms` - Anti-rimbalzo pulsanti
- `PAIRING_PRESS_DURATION = 2000ms` - Durata pressione pairing
- `Pairing window = 60000ms` - Finestra pairing aperta

### Persistenza
- File: `/pairing.json` in LittleFS
- Contenuto: `{"sessionTopic": "...", "teamNumber": 1}`
- Caricato automaticamente all'avvio

### MQTT QoS
- Pairing request: QoS 0 (default)
- Pairing response: QoS 1 (garantito)
- Score events: QoS 0 (real-time, best effort)

---

**Buon testing!** 🎮
