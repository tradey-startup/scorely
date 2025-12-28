# 👥 STEP 5 – Multi-Braccialetto & Team

## 📋 Obiettivo
Gestire **partite reali con più giocatori** attraverso:
- Assegnazione automatica team durante il pairing
- Gestione eventi simultanei da più braccialetti
- Protezione da eventi duplicati (idempotenza)
- Rate limiting per prevenire spam
- Bilanciamento automatico dei team

## ✅ Completato

### 1. **Event Deduplication** (Anti-Duplicazione)
Il [session-service.js](cloud/session-service.js) ora previene eventi duplicati:

```javascript
// Cache degli eventi recenti (5 secondi TTL)
const eventCache = new Map();

function isDuplicateEvent(payload) {
  const eventKey = `${payload.deviceId}_${payload.timestamp}`;

  if (eventCache.has(eventKey)) {
    return true; // Duplicato!
  }

  eventCache.set(eventKey, now + EVENT_CACHE_TTL);
  return false;
}
```

**Perché è importante:**
- MQTT può consegnare messaggi duplicati (QoS 1)
- Riconnessioni possono causare ri-invii
- Previene punteggi sbagliati

---

### 2. **Rate Limiting** (Anti-Spam)
Protezione da braccialetti malfunzionanti o spam:

```javascript
// Max 10 eventi al secondo per dispositivo
const RATE_LIMIT_WINDOW = 1000; // 1 secondo
const MAX_EVENTS_PER_WINDOW = 10;

function isRateLimited(deviceId) {
  // Conta eventi nella finestra temporale
  // Blocca se > MAX_EVENTS_PER_WINDOW
}
```

**Cosa previene:**
- Pulsanti bloccati
- Malfunzionamenti hardware
- Attacchi spam

---

### 3. **Team Assignment Automatico** (già in STEP 3)
Il [pairing-service.js](cloud/pairing-service.js:133-135) bilancia automaticamente i team:

```javascript
const team1Count = pairedDevices.filter(d => d.team === 1).length;
const team2Count = pairedDevices.filter(d => d.team === 2).length;
const assignedTeam = team1Count <= team2Count ? 1 : 2;
```

**Regola:**
- Il primo braccialetto → Team 1
- Il secondo braccialetto → Team 2
- Il terzo braccialetto → Team 1 (riequilibrio)
- Il quarto braccialetto → Team 2

---

### 4. **Paired Devices Tracking**
Il session state ora include i dispositivi paired:

```json
{
  "sessionId": "TEST01",
  "status": "running",
  "score": {
    "team1": 2,
    "team2": 1
  },
  "pairedDevices": [
    {
      "deviceId": "bracelet_a1b2c3d4",
      "team": 1,
      "pairedAt": 1700000000
    },
    {
      "deviceId": "bracelet_e5f6g7h8",
      "team": 2,
      "pairedAt": 1700000005
    }
  ],
  "lastUpdate": 1700000010,
  "timestamp": 1700000010
}
```

**Vantaggi:**
- Web App può mostrare chi è connesso
- Validazione degli eventi
- Debug e monitoring

---

### 5. **Pairing Notification System**
Il pairing service notifica il session service quando un device viene paired:

```
┌────────────────┐
│ Pairing Service│
└───────┬────────┘
        │
        │ 1. Device paired
        │
        v
session/TEST01/pairing
{"action": "device_paired", "device": {...}}
        │
        v
┌────────────────┐
│ Session Service│
│ Updates state  │
└────────────────┘
```

---

## 🧪 Come Testare

### Setup Completo

#### Terminale 1: Session Service
```bash
cd cloud
node session-service.js
```

**Output atteso:**
```
🎮 Session Service Starting...
✅ Connected to MQTT broker
📡 Subscribed to: session/+/event
📡 Subscribed to: session/+/command
📡 Subscribed to: session/+/pairing
🎯 Session service ready!
```

#### Terminale 2: Pairing Service
```bash
cd cloud
node pairing-service.js
```

**Output atteso:**
```
🔗 Pairing Service Starting...
✅ Connected to MQTT broker
📡 Subscribed to: pairing/request
📡 Subscribed to: session/+/command
🎯 Waiting for pairing requests...
```

#### Terminale 3: Multi-Bracelet Test Script
```bash
cd cloud
node test-multi-bracelet.js
```

**Output atteso:**
```
🧪 STEP 5: Multi-Bracelet Test Script
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Prerequisites:
1. session-service.js is running
2. pairing-service.js is running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to MQTT broker...
✅ Connected to MQTT broker

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 MULTI-BRACELET TEST MENU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 - Start session
2 - Open pairing (60 seconds)
3 - Pair all 4 virtual bracelets
4 - Simulate concurrent score events (all bracelets)
5 - Test duplicate event prevention
6 - Test rate limiting (spam events)
7 - Simulate Team 1 scoring
8 - Simulate Team 2 scoring
9 - Reset score
s - Show current state
q - Quit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 Choose an option:
```

---

## 🎯 Test Scenario Completo

### Test 1: Avvio Sessione e Pairing 4 Braccialetti

**Nel terminale test-multi-bracelet.js:**
```
Premi: 1  (Start session)
Premi: 2  (Open pairing)
Premi: 3  (Pair all 4 virtual bracelets)
```

**Cosa succede:**

1. **Session service** crea la sessione:
   ```
   🟢 Starting session: TEST01
   ✅ Session TEST01 started
   ```

2. **Pairing service** apre la finestra di pairing:
   ```
   🔓 Opening pairing for session: TEST01
   ⏱️  Pairing will expire in 60s
   ```

3. **4 braccialetti** inviano richieste di pairing:
   ```
   📱 PAIRING REQUEST RECEIVED
   Device ID: virtual_bracelet_01
   ✅ PAIRING SUCCESSFUL
   Session: TEST01
   Team: 1

   📱 PAIRING REQUEST RECEIVED
   Device ID: virtual_bracelet_02
   ✅ PAIRING SUCCESSFUL
   Session: TEST01
   Team: 2

   📱 PAIRING REQUEST RECEIVED
   Device ID: virtual_bracelet_03
   ✅ PAIRING SUCCESSFUL
   Session: TEST01
   Team: 1

   📱 PAIRING REQUEST RECEIVED
   Device ID: virtual_bracelet_04
   ✅ PAIRING SUCCESSFUL
   Session: TEST01
   Team: 2
   ```

4. **Session service** riceve le notifiche:
   ```
   👥 New device paired to session TEST01
      Device: virtual_bracelet_01
      Team: 1
   ✅ Device added to session state
      Total paired devices: 1

   👥 New device paired to session TEST01
      Device: virtual_bracelet_02
      Team: 2
   ✅ Device added to session state
      Total paired devices: 2

   (e così via...)
   ```

5. **Test script** riceve snapshot aggiornato:
   ```
   📸 STATE SNAPSHOT RECEIVED
   Session: TEST01
   Status: running
   Score: Team 1: 0 - Team 2: 0

   👥 Paired Devices (4):
      Team 1 (2):
        - virtual_bracelet_01
        - virtual_bracelet_03
      Team 2 (2):
        - virtual_bracelet_02
        - virtual_bracelet_04
   ```

**✅ Risultato:** 4 braccialetti paired e bilanciati automaticamente!

---

### Test 2: Eventi Concorrenti

**Nel terminale test-multi-bracelet.js:**
```
Premi: 4  (Simulate concurrent events)
```

**Cosa succede:**

Tutti e 4 i braccialetti inviano eventi quasi simultaneamente (100ms di distanza):

```
📤 Sent 4 concurrent events

⚡ SCORE EVENT RECEIVED (session-service)
Session: TEST01
Team: 1
Device: virtual_bracelet_01
📊 Score updated: Team 1: 0 → 1

⚡ SCORE EVENT RECEIVED
Session: TEST01
Team: 2
Device: virtual_bracelet_02
📊 Score updated: Team 2: 0 → 1

⚡ SCORE EVENT RECEIVED
Session: TEST01
Team: 1
Device: virtual_bracelet_03
📊 Score updated: Team 1: 1 → 2

⚡ SCORE EVENT RECEIVED
Session: TEST01
Team: 2
Device: virtual_bracelet_04
📊 Score updated: Team 2: 1 → 2
```

**Test script riceve:**
```
📸 STATE SNAPSHOT RECEIVED
Score: Team 1: 2 - Team 2: 2
```

**✅ Risultato:** Tutti gli eventi processati correttamente senza conflitti!

---

### Test 3: Duplicate Event Prevention

**Nel terminale test-multi-bracelet.js:**
```
Premi: 5  (Test duplicate prevention)
```

**Cosa succede:**

Il test invia **3 volte** lo stesso evento (stesso deviceId + timestamp):

```
📤 Sending same event 3 times with identical timestamp...
   Device: virtual_bracelet_01
   Timestamp: 1700000100
   Expected: Only 1 should be processed

   Attempt 1/3 sent
   Attempt 2/3 sent
   Attempt 3/3 sent
```

**Session service log:**
```
⚡ SCORE EVENT RECEIVED
Session: TEST01
Device: virtual_bracelet_01
Team: 1
📊 Score updated: Team 1: 2 → 3
📸 State snapshot published (RETAINED)

⚠️  DUPLICATE EVENT DETECTED - Ignoring
   Device: virtual_bracelet_01
   Timestamp: 1700000100

⚠️  DUPLICATE EVENT DETECTED - Ignoring
   Device: virtual_bracelet_01
   Timestamp: 1700000100
```

**Test script riceve:**
```
📸 STATE SNAPSHOT RECEIVED
Score: Team 1: 3 - Team 2: 2
```

**✅ Risultato:** Solo il primo evento elaborato, duplicati ignorati!

---

### Test 4: Rate Limiting

**Nel terminale test-multi-bracelet.js:**
```
Premi: 6  (Test rate limiting)
```

**Cosa succede:**

Il test invia **15 eventi in 500ms** dallo stesso braccialetto:

```
📤 Sending 15 events in 500ms from virtual_bracelet_01
   Rate limit: 10 events/second
   Expected: First 10 processed, rest rejected

   Event 1/15 sent
   Event 2/15 sent
   ...
   Event 15/15 sent
```

**Session service log:**
```
⚡ SCORE EVENT RECEIVED (Event 1)
📊 Score updated: Team 1: 3 → 4

⚡ SCORE EVENT RECEIVED (Event 2)
📊 Score updated: Team 1: 4 → 5

...

⚡ SCORE EVENT RECEIVED (Event 10)
📊 Score updated: Team 1: 12 → 13

⚠️  RATE LIMIT EXCEEDED - Ignoring (Event 11)
   Device: virtual_bracelet_01
   Too many events in short time

⚠️  RATE LIMIT EXCEEDED - Ignoring (Event 12)
...
⚠️  RATE LIMIT EXCEEDED - Ignoring (Event 15)
```

**✅ Risultato:** Primi 10 eventi processati, gli altri bloccati!

---

## 📊 Architettura MQTT (Aggiornata STEP 5)

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Braccialetto│  │ Braccialetto│  │ Braccialetto│  │ Braccialetto│
│   Team 1    │  │   Team 2    │  │   Team 1    │  │   Team 2    │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       │ Premi +        │ Premi +        │ Premi +        │ Premi +
       │                │                │                │
       v                v                v                v
       └────────────────┴────────────────┴────────────────┘
                              │
                              v
                  session/TEST01/event
                  {"type": "score", "action": "increment", ...}
                              │
                              v
                  ┌───────────────────┐
                  │  Session Service  │
                  │                   │
                  │  1. Dedup check   │
                  │  2. Rate limit    │
                  │  3. Update score  │
                  │  4. Publish state │
                  └───────┬───────────┘
                          │
                          v
              session/TEST01/state (RETAINED)
              {"score": {"team1": X, "team2": Y}, "pairedDevices": [...]}
                          │
                          ├──────> [Web App]
                          ├──────> [ESP32 Tabellone]
                          └──────> [Test Script]
```

---

## 🎯 Test Critici - Checklist

| Test | Descrizione | Come Testare | Stato |
|------|-------------|--------------|-------|
| ✅ | Team assignment bilanciato | Pair 4 braccialetti, verifica 2+2 | |
| ✅ | Eventi simultanei gestiti | Opzione 4 nel test script | |
| ✅ | Duplicate prevention funziona | Opzione 5 nel test script | |
| ✅ | Rate limiting previene spam | Opzione 6 nel test script | |
| ✅ | Paired devices in snapshot | Verifica campo pairedDevices | |
| ✅ | Pairing notification sync | Verifica log session-service | |
| ⚠️ | 4 ESP32 fisici simultanei | Test con hardware reale | |
| ⚠️ | Wi-Fi instabile con multi-device | Spegni/riaccendi Wi-Fi durante partita | |

---

## 🐛 Troubleshooting

### Eventi duplicati passano comunque
- Verifica che `isDuplicateEvent()` sia chiamata prima di `updateScore()`
- Controlla che i timestamp siano identici
- Verifica la durata del EVENT_CACHE_TTL (5 secondi)

### Rate limiting troppo aggressivo
- Aumenta MAX_EVENTS_PER_WINDOW (default: 10)
- Aumenta RATE_LIMIT_WINDOW (default: 1000ms)
- Verifica che il timestamp sia diverso per ogni evento

### Team assignment sbilanciato
- Verifica la logica in [pairing-service.js](cloud/pairing-service.js:133-135)
- Controlla che `pairedDevices` sia correttamente popolato
- Verifica che il conteggio team1/team2 sia corretto

### Paired devices non appaiono nello snapshot
- Verifica che pairing-service pubblichi su `session/{sessionId}/pairing`
- Verifica che session-service sia subscribed a `session/+/pairing`
- Controlla che `handlePairingNotification()` aggiunga il device

---

## 📦 File Modificati/Creati

```
scorely/
├── cloud/
│   ├── session-service.js              [MODIFICATO] Event dedup + rate limiting + paired devices
│   ├── pairing-service.js              [MODIFICATO] Pairing notification
│   └── test-multi-bracelet.js          [NUOVO] Test script per 4 braccialetti
│
└── STEP5-MULTI-BRACELET-GUIDE.md       [NUOVO] Questa guida
```

---

## 🔑 Concetti Chiave

### 1. Event Idempotency (Idempotenza)

**Definizione:** Un'operazione è idempotente se può essere eseguita più volte senza cambiare il risultato oltre la prima applicazione.

```javascript
// ❌ NON IDEMPOTENTE
function handleEvent(event) {
  score++;  // Ogni chiamata incrementa!
}

// ✅ IDEMPOTENTE
function handleEvent(event) {
  if (isDuplicateEvent(event)) {
    return;  // Ignora duplicati
  }
  score++;
}
```

**Perché serve:**
- MQTT QoS 1 può duplicare messaggi
- Riconnessioni causano re-invii
- Garantisce punteggi corretti

---

### 2. Rate Limiting Patterns

**Sliding Window:**
```javascript
// Conta eventi nella finestra temporale scorrevole
windowStart = now
if (now - windowStart > WINDOW_SIZE) {
  reset counter
}
```

**Token Bucket (alternativa):**
```javascript
// Ogni device ha un "secchio" di token
// Ogni evento consuma 1 token
// I token si rigenerano nel tempo
```

**Nel nostro sistema usiamo Sliding Window** perché:
- Più semplice da implementare
- Sufficiente per prevenire spam
- Non richiede task di background

---

### 3. Team Balancing Strategy

```javascript
// Strategia: Sempre assegna al team con MENO dispositivi
const assignedTeam = team1Count <= team2Count ? 1 : 2;
```

**Scenari:**
```
Dispositivi paired: []
→ Nuovo device: Team 1 (team1Count=0, team2Count=0)

Dispositivi paired: [Team 1]
→ Nuovo device: Team 2 (team1Count=1, team2Count=0)

Dispositivi paired: [Team 1, Team 2]
→ Nuovo device: Team 1 (team1Count=1, team2Count=1, usa <=)

Dispositivi paired: [Team 1, Team 2, Team 1]
→ Nuovo device: Team 2 (team1Count=2, team2Count=1)
```

**Risultato:** Team sempre bilanciati o max ±1 di differenza.

---

### 4. State Synchronization

**Pattern:** Pairing Service → Notification → Session Service

```javascript
// pairing-service.js
function handlePairingSuccess() {
  // 1. Salva device localmente
  pairedDevices.push(deviceInfo);

  // 2. Rispondi al braccialetto
  sendPairingResponse(deviceId, response);

  // 3. Notifica session service
  notifySessionServicePairing(sessionId, deviceInfo);
}

// session-service.js
function handlePairingNotification(payload) {
  // 1. Ricevi notifica
  // 2. Aggiorna session state
  session.pairedDevices.push(deviceInfo);

  // 3. Pubblica snapshot aggiornato
  publishStateSnapshot(sessionId);
}
```

**Vantaggio:** Session state è sempre sincronizzato senza polling.

---

## 📊 Performance Considerations

### Event Deduplication Cache Size

Con 4 braccialetti e rate limit 10 eventi/sec:
```
Max eventi/sec: 4 * 10 = 40
Cache TTL: 5 secondi
Max cache size: 40 * 5 = 200 entries
Memory usage: ~10KB
```

**Conclusione:** Trascurabile, nessun problema di memoria.

---

### Rate Limiting Impact

Con 10 eventi/sec per device:
```
Tempo minimo tra eventi: 100ms
Debounce pulsanti hardware: ~50ms
Margine di sicurezza: 50ms
```

**Conclusione:** Gioco normale non sarà mai limitato. Solo spam viene bloccato.

---

### Concurrent Events Processing

MQTT + Node.js event loop gestisce naturalmente concorrenza:
```javascript
// Questi eventi arrivano quasi simultaneamente
Event 1 (t=100ms) → handleScoreEvent() → update score → publish state
Event 2 (t=102ms) → handleScoreEvent() → update score → publish state
Event 3 (t=105ms) → handleScoreEvent() → update score → publish state
```

Node.js processa eventi **sequenzialmente** nel event loop, quindi:
- Nessun race condition
- Nessuna perdita di dati
- Score sempre coerente

---

## 🎉 Output Atteso Finale

Se tutto funziona:

1. ✅ 4 braccialetti paired correttamente
2. ✅ Team bilanciati (2+2)
3. ✅ Eventi simultanei gestiti senza conflitti
4. ✅ Eventi duplicati ignorati
5. ✅ Rate limiting previene spam
6. ✅ Snapshot include paired devices
7. ✅ Nessuna perdita o duplicazione punteggio

**Questo è lo STEP 5 completo!** 🚀

---

## 🔜 Prossimi Step

Ora che hai multi-braccialetto e team funzionanti:

- **STEP 6**: UX completa con Web App e QR code
- **STEP 7**: Storico partite & location management
- **STEP 8**: Sicurezza & ruoli client

---

## 🧪 Test con Hardware Reale

### Setup con 4 ESP32

1. **Flash firmware su 4 ESP32**
   ```bash
   cd devices
   pio run -t upload
   ```

2. **Monitor seriale su tutti e 4**
   - Usa 4 terminali separati
   - Oppure usa un multiplexer seriale

3. **Esegui test sequence:**
   ```
   a) Avvia session-service.js
   b) Avvia pairing-service.js
   c) Avvia test-session.js (non il multi-bracelet)
   d) Start session
   e) Open pairing
   f) Premi + e - su ESP32 #1 → Team 1
   g) Premi + e - su ESP32 #2 → Team 2
   h) Premi + e - su ESP32 #3 → Team 1
   i) Premi + e - su ESP32 #4 → Team 2
   j) Premi + su tutti e 4 quasi simultaneamente
   k) Verifica punteggio: Team 1: 2, Team 2: 2
   ```

4. **Test stress:**
   - Spegni/riaccendi Wi-Fi
   - Disconnetti ESP32 durante partita
   - Premi pulsanti rapidamente (spam test)
   - Verifica nessuna perdita punteggio

---

## 📝 Note Tecniche

### MQTT Topic Schema (Completo)

```
pairing/request                      → Richieste pairing dai braccialetti
pairing/response/{deviceId}          → Risposte pairing ai braccialetti

session/{sessionId}/command          → Comandi (start/stop/reset/request_state/open_pairing)
session/{sessionId}/event            → Eventi score dai braccialetti
session/{sessionId}/state            → Snapshot stato (RETAINED)
session/{sessionId}/pairing          → Notifiche pairing (pairing → session service)
```

---

### Rate Limiting Configuration

```javascript
// Valori default (consigliati per gioco normale)
RATE_LIMIT_WINDOW = 1000ms        // 1 secondo
MAX_EVENTS_PER_WINDOW = 10        // 10 eventi/sec

// Valori per ambiente test rapido
RATE_LIMIT_WINDOW = 500ms         // 0.5 secondi
MAX_EVENTS_PER_WINDOW = 20        // 20 eventi/sec

// Valori per ambiente produzione conservativo
RATE_LIMIT_WINDOW = 2000ms        // 2 secondi
MAX_EVENTS_PER_WINDOW = 5         // 5 eventi/sec
```

---

### Event Deduplication TTL

```javascript
// Valori default
EVENT_CACHE_TTL = 5000ms          // 5 secondi

// Perché 5 secondi?
// - Tipico timeout riconnessione MQTT: 2-3s
// - Margine di sicurezza: +2s
// - Totale: 5s
```

---

**Buon testing con il multi-braccialetto!** 🎮👥
