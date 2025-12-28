# 🔄 STEP 4 – Stato Persistente & Riconnessioni

## 📋 Obiettivo
Garantire **robustezza in scenari reali** attraverso:
- Salvataggio dello stato della sessione nel cloud
- Messaggi MQTT retained per persistenza
- Riconnessione automatica robusta dell'ESP32
- Nessuna perdita di punteggio in caso di disconnessioni

## ✅ Completato

### 1. **Session Service (Gestione Stato)**
Il nuovo servizio ([cloud/session-service.js](cloud/session-service.js)) è il cuore dello STEP 4:

- ✅ Gestione sessioni in memoria (Map)
- ✅ Ascolto eventi di punteggio su `session/+/event`
- ✅ Aggiornamento stato automatico
- ✅ Pubblicazione snapshot su `session/{sessionId}/state` (RETAINED)
- ✅ Comandi sessione: start, stop, reset, request_state

### 2. **MQTT Retained Messages**
Il pattern chiave dello STEP 4:

```
Topic: session/TEST01/state
Flags: QoS 1, RETAIN = true
```

**Cosa significa RETAINED:**
- Il broker MQTT **salva l'ultimo messaggio**
- Ogni nuovo client che si connette **riceve immediatamente** lo stato
- Anche dopo riavvii, lo stato è disponibile

### 3. **ESP32 Riconnessione Robusta**
Il codice ESP32 ([devices/src/main.cpp](devices/src/main.cpp)) ora include:

- ✅ Retry con backoff esponenziale (2s, 4s, 6s, 8s, 10s)
- ✅ Limite massimo di tentativi (5)
- ✅ Auto-restart dopo fallimento totale
- ✅ Subscribe automatico a `session/{sessionId}/state`
- ✅ Richiesta snapshot su riconnessione

### 4. **Test Interattivo**
Lo script [cloud/test-session.js](cloud/test-session.js) offre:

- ✅ Menu interattivo per controllare la sessione
- ✅ Test di disconnessione/riconnessione
- ✅ Visualizzazione snapshot in tempo reale
- ✅ Monitoraggio eventi dai braccialetti

---

## 🧪 Come Testare

### Prerequisiti
1. ESP32 con pairing già configurato (STEP 3)
2. Node.js installato
3. Servizi cloud pronti

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

#### Terminale 3: Test Interattivo
```bash
cd cloud
node test-session.js
```

**Output atteso:**
```
🧪 Complete Session Test Script (STEP 4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Prerequisites:
1. session-service.js is running
2. pairing-service.js is running
3. ESP32 bracelet is ready
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 Connecting to MQTT broker...
✅ Connected to MQTT broker

📡 Subscribed to state: session/TEST01/state
   (Will receive RETAINED state on subscription)

📡 Subscribed to events: session/TEST01/event

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 INTERACTIVE MENU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 - Start session
2 - Open pairing (60 seconds)
3 - Stop session
4 - Reset score
5 - Request current state
6 - Simulate disconnect/reconnect test
q - Quit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👉 Choose an option (or press buttons on bracelet):
```

---

## 🎯 Test Scenario Completo

### Test 1: Avvio Sessione

**Nel terminale test-session.js:**
```
Premi: 1
```

**Cosa succede:**

1. **test-session.js** invia comando:
   ```json
   Topic: session/TEST01/command
   {"action": "start"}
   ```

2. **session-service.js** riceve e crea sessione:
   ```
   🟢 Starting session: TEST01
   ✅ Session TEST01 started
   ```

3. Pubblica snapshot (RETAINED):
   ```json
   Topic: session/TEST01/state (RETAIN=true)
   {
     "sessionId": "TEST01",
     "status": "running",
     "score": {
       "team1": 0,
       "team2": 0
     },
     "lastUpdate": 1700000000,
     "timestamp": 1700000000
   }
   ```

4. **test-session.js** riceve snapshot:
   ```
   📸 STATE SNAPSHOT RECEIVED (RETAINED)
   Session: TEST01
   Status: running
   Score: Team 1: 0 - Team 2: 0
   ```

---

### Test 2: Pairing Braccialetto

**Nel terminale test-session.js:**
```
Premi: 2
```

**Output:**
```
🔓 Opening pairing for 60 seconds...
✅ Pairing window opened!
👉 Now press + and - together on your bracelet!
```

**Sul braccialetto ESP32:**
- Premi + e - insieme per 2 secondi
- LED lampeggia 3 volte (richiesta)
- LED lampeggia 5 volte (successo!)

**Pairing service log:**
```
📱 PAIRING REQUEST RECEIVED
Device ID: bracelet_a1b2c3d4
✅ PAIRING SUCCESSFUL
Session: TEST01
Team: 1
```

---

### Test 3: Eventi di Punteggio

**Sul braccialetto:**
- Premi **+** (incrementa Team 1)

**ESP32 Serial Monitor:**
```
Event sent: increment for team 1
```

**session-service.js log:**
```
⚡ SCORE EVENT RECEIVED
Session: TEST01
Action: increment
Team: 1
Device: bracelet_a1b2c3d4

📊 Score updated:
   Team 1: 0 → 1
   Current state: Team 1: 1 - Team 2: 0

📸 State snapshot published (RETAINED)
```

**test-session.js riceve:**

1. L'evento originale:
   ```
   ⚡ SCORE EVENT FROM BRACELET
   Device: bracelet_a1b2c3d4
   Team: 1
   Action: increment
   ```

2. Lo snapshot aggiornato:
   ```
   📸 STATE SNAPSHOT RECEIVED (RETAINED)
   Session: TEST01
   Status: running
   Score: Team 1: 1 - Team 2: 0
   ```

---

### Test 4: Riconnessione ESP32

**Scenario:** Spegni e riaccendi il Wi-Fi o l'ESP32

**ESP32 Serial Monitor:**
```
Connecting to MQTT broker (attempt 1/5)...connected!
Already paired, ready to send events
Subscribed to state updates: session/TEST01/state
Requested current state snapshot

📸 State snapshot received:
   Team 1: 1
   Team 2: 0
   Status: running
```

**Cosa è successo:**
1. ESP32 si riconnette automaticamente
2. Richiede lo snapshot corrente
3. **Riceve immediatamente lo stato** (grazie al RETAIN flag)
4. È pronto a continuare da dove aveva interrotto

---

### Test 5: Disconnessione/Riconnessione Client

**Nel terminale test-session.js:**
```
Premi: 6
```

**Output:**
```
🔄 RECONNECTION TEST
1. Disconnect from MQTT broker
2. Wait 3 seconds
3. Reconnect and request state
4. Verify state is preserved

🔌 Disconnecting...
✅ Disconnected

(aspetta 3 secondi)

🔌 Reconnecting...
✅ Reconnected!

📸 Receiving RETAINED state snapshot...
💡 The state should be preserved from before disconnect!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 STATE SNAPSHOT RECEIVED (RETAINED)
Session: TEST01
Status: running
Score: Team 1: 1 - Team 2: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Risultato:** Lo stato è **perfettamente preservato**! 🎉

---

## 📊 Architettura MQTT (Aggiornata)

```
┌─────────────┐
│ ESP32       │
│ Braccialetto│
└──────┬──────┘
       │
       │ 1. Premi +
       │
       v
 session/TEST01/event
 {"type": "score", "action": "increment", "team": 1, ...}
       │
       v
┌──────────────────┐
│ Session Service  │
│ (Node.js)        │
└──────┬───────────┘
       │
       │ 2. Aggiorna stato in memoria
       │ 3. Pubblica snapshot RETAINED
       │
       v
 session/TEST01/state (RETAINED, QoS 1)
 {"sessionId": "TEST01", "score": {"team1": 1, "team2": 0}, ...}
       │
       ├──────> [Web App] ──> Riceve aggiornamento
       ├──────> [ESP32] ────> Riceve aggiornamento
       └──────> [Broker] ───> SALVA messaggio in memoria

┌─────────────────────────────────────────┐
│ NUOVO CLIENT SI CONNETTE                │
└──────┬──────────────────────────────────┘
       │
       v
 Subscribe: session/TEST01/state
       │
       v
 RICEVE IMMEDIATAMENTE LO STATO SALVATO! ✅
```

---

## 🎯 Test Critici - Checklist

| Test | Descrizione | Come Testare | Stato |
|------|-------------|--------------|-------|
| ✅ | Session service gestisce stato | Avvia sessione, verifica snapshot | |
| ✅ | Eventi score aggiornano stato | Premi +/-, verifica nuovo snapshot | |
| ✅ | Snapshot è RETAINED | Disconnetti/riconnetti client, verifica ricezione | |
| ✅ | ESP32 riconnessione automatica | Spegni Wi-Fi, verifica riconnessione | |
| ✅ | ESP32 richiede stato su connessione | Riavvia ESP32, verifica log snapshot | |
| ✅ | Nessuna perdita punteggio | Score durante disconnessione ESP32 | |
| ✅ | Comandi sessione funzionano | Test start/stop/reset | |
| ✅ | Multiple sessioni supportate | Crea TEST01 e TEST02 | |

---

## 🐛 Troubleshooting

### Snapshot non arriva dopo riconnessione
- Verifica che il flag `retain: true` sia impostato nella publish
- Controlla che il topic sia esattamente lo stesso
- Usa MQTT Explorer per verificare messaggi retained sul broker

### ESP32 non si riconnette
- Verifica credenziali MQTT
- Controlla Serial Monitor per codici errore
- Verifica che MAX_RETRIES non sia troppo basso

### Session service non riceve eventi
- Verifica che sia subscribed a `session/+/event`
- Controlla che l'ESP32 stia pubblicando sul topic corretto
- Verifica log del session-service

### Stato non si aggiorna
- Verifica che session-service.js sia in esecuzione
- Controlla che il sessionId sia corretto
- Verifica che la sessione sia stata avviata (comando `start`)

---

## 📦 File Modificati/Creati

```
scorely/
├── devices/
│   └── src/
│       └── main.cpp                     [MODIFICATO] Riconnessione robusta + state request
│
├── cloud/
│   ├── session-service.js               [NUOVO] Gestione stato e persistenza
│   ├── pairing-service.js               [ESISTENTE] Invariato
│   └── test-session.js                  [MODIFICATO] Test interattivo completo
│
└── STEP4-PERSISTENCE-GUIDE.md           [NUOVO] Questa guida
```

---

## 🔑 Concetti Chiave

### 1. MQTT Retained Messages
```javascript
// Messaggio normale (sparisce dopo la consegna)
client.publish(topic, payload, { qos: 1 })

// Messaggio RETAINED (salvato dal broker)
client.publish(topic, payload, { qos: 1, retain: true })
```

**Quando usare RETAIN:**
- Stato della sessione (snapshot)
- Configurazioni
- Ultimi valori conosciuti

**Quando NON usare RETAIN:**
- Eventi transitori (score events)
- Log/debug
- Comandi one-time

### 2. State Snapshot Pattern

**Regola d'oro:** Ogni modifica allo stato = nuovo snapshot RETAINED

```javascript
// ❌ SBAGLIATO
function updateScore(team) {
  score[team]++;
  // Manca la pubblicazione dello snapshot!
}

// ✅ CORRETTO
function updateScore(team) {
  score[team]++;
  publishStateSnapshot(); // RETAIN = true
}
```

### 3. Riconnessione Robusta

**ESP32 Pattern:**
```cpp
1. Tentativo connessione
2. Se fallisce → backoff esponenziale
3. Dopo MAX_RETRIES → riavvio completo
4. Su successo → subscribe + request state
```

---

## 🎉 Output Atteso Finale

Se tutto funziona:

1. ✅ Sessione avviata con snapshot iniziale
2. ✅ Braccialetto paired correttamente
3. ✅ Eventi score aggiornano stato
4. ✅ Ogni evento genera nuovo snapshot RETAINED
5. ✅ Riconnessione client riceve stato immediatamente
6. ✅ Riconnessione ESP32 riceve stato immediatamente
7. ✅ **Zero perdite di punteggio**

**Questo è lo STEP 4 completo!** 🚀

---

## 🔜 Prossimi Step

Ora che hai stato persistente e riconnessioni robuste:

- **STEP 5**: Multi-braccialetto & gestione team
- **STEP 6**: UX completa con Web App e QR code
- **STEP 7**: Storico partite & location management

---

## 📝 Note Tecniche

### MQTT QoS Levels
- **QoS 0** (at most once): Eventi real-time non critici
- **QoS 1** (at least once): Snapshot stato, comandi, pairing ✅
- **QoS 2** (exactly once): Non necessario per questo progetto

### Session State Schema
```json
{
  "sessionId": "TEST01",
  "status": "waiting | running | ended",
  "score": {
    "team1": 0,
    "team2": 0
  },
  "startedAt": 1700000000,
  "lastUpdate": 1700000000,
  "timestamp": 1700000000
}
```

### ESP32 Reconnection Backoff
```
Attempt 1: 2s
Attempt 2: 4s
Attempt 3: 6s
Attempt 4: 8s
Attempt 5: 10s
Fallback: ESP.restart()
```

---

**Buon testing con lo stato persistente!** 🎮
