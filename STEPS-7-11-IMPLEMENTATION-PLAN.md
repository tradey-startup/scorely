# Piano di Implementazione Step 7-11

## 📋 Analisi Situazione Attuale

### ✅ Cosa Funziona (Step 1-6)
- ✅ Session Service con gestione stato in memoria
- ✅ Pairing Service con assegnamento automatico team
- ✅ Web App con flow UX completo (Welcome → QR → Pairing → Match)
- ✅ Multi-bracelet support (fino a 4 dispositivi)
- ✅ Event deduplication e rate limiting
- ✅ QR code per accesso rapido
- ✅ MQTT broker cloud (HiveMQ)
- ✅ Firebase Functions setup (cartella `cloud/functions/`)

### 🔍 Cosa Manca (Step 7-11)
- ❌ Persistenza partite su database
- ❌ Query e visualizzazione storico
- ❌ Gestione location multiple
- ❌ Sistema ruoli e autenticazione
- ❌ Testing automatizzato completo
- ❌ Documentazione deployment produzione

---

## 🗂️ STEP 7: Storico Partite & Location

### Obiettivi
1. Salvare partite completate su Firestore
2. Query storico per location
3. UI visualizzazione storico nella web app
4. Gestione multi-location (campo_01, campo_02, ecc.)

### Architettura Database Firestore

```
scorely-db/
├── locations/
│   ├── campo_01/
│   │   ├── name: "Campo Principale"
│   │   ├── address: "..."
│   │   └── active: true
│   └── campo_02/
│       └── ...
├── matches/
│   ├── {matchId}/
│   │   ├── sessionId: "ABC123"
│   │   ├── locationId: "campo_01"
│   │   ├── startTime: timestamp
│   │   ├── endTime: timestamp
│   │   ├── duration: seconds
│   │   ├── finalScore: {team1: 12, team2: 9}
│   │   ├── winner: "team1" | "team2" | "draw"
│   │   ├── pairedDevices: [{deviceId, team}, ...]
│   │   └── events: [{timestamp, team, action}, ...]
└── sessions/
    ├── {sessionId}/
    │   ├── locationId: "campo_01"
    │   ├── status: "waiting" | "running" | "ended"
    │   ├── createdAt: timestamp
    │   ├── currentScore: {team1, team2}
    │   └── lastUpdated: timestamp
```

### Implementazione

#### 7.1 Database Service
File: `cloud/database-service.js`

Funzionalità:
- `saveMatch(matchData)`: Salva partita completata
- `getMatchHistory(locationId, limit, offset)`: Recupera storico
- `getMatchById(matchId)`: Dettaglio partita
- `getLocations()`: Lista location attive
- `createLocation(locationData)`: Crea nuova location

#### 7.2 Integrazione Session Service
Modifica: `cloud/session-service.js`

Aggiungere:
- Listener per evento "end_session"
- Calcolo statistiche partita (durata, vincitore, eventi)
- Chiamata a `database-service.saveMatch()` a fine partita

#### 7.3 API REST per Query
File: `cloud/api-service.js`

Endpoint:
- `GET /api/matches?location={id}&limit={n}&offset={n}`: Lista partite
- `GET /api/matches/{matchId}`: Dettaglio partita
- `GET /api/locations`: Lista location
- `GET /api/stats/{locationId}`: Statistiche location

#### 7.4 UI Storico nella Web App
File: `webapp/test/src/components/MatchHistory.jsx`

Componenti:
- Lista partite (tabella/card)
- Filtri per location e data
- Dettaglio partita (modal)
- Statistiche aggregate

---

## 🔐 STEP 8: Sicurezza & Ruoli

### Obiettivi
1. Sistema ruoli: display, controller, admin
2. Token sessione per autenticazione
3. Limitazione comandi critici per ruolo
4. Prevenzione conflitti tra device

### Architettura Ruoli

```
Ruoli:
- DISPLAY: Solo visualizzazione (TV, tabellone)
- CONTROLLER: Controllo partita (iPad admin)
- VIEWER: Visualizzazione + input manuale (tablet giocatori)
- ADMIN: Accesso completo (web admin)
```

### Implementazione

#### 8.1 Token Service
File: `cloud/auth-service.js`

Funzionalità:
- `generateToken(sessionId, role)`: Genera JWT
- `validateToken(token)`: Valida e decodifica
- `checkPermissions(token, action)`: Verifica permessi

#### 8.2 MQTT ACL (Access Control List)
Configurazione HiveMQ:
- Topic `session/{id}/state`: READ tutti, WRITE solo controller/admin
- Topic `session/{id}/command`: WRITE solo controller/admin
- Topic `session/{id}/event`: WRITE braccialetti + controller

#### 8.3 Modifica Session Context
File: `webapp/test/src/context/SessionContext.jsx`

Aggiungere:
- `role` state
- `token` state
- Controlli permessi prima di ogni azione

#### 8.4 Login/Ruolo UI
File: `webapp/test/src/components/RoleSelector.jsx`

Componenti:
- Scelta ruolo all'ingresso
- PIN per admin
- Token storage in localStorage

---

## 🧪 STEP 9: Testing & Hardening

### Obiettivi
1. Stress test MQTT (1000+ messaggi/sec)
2. Test disconnessioni e riconnessioni
3. Test multi-campo (3+ sessioni parallele)
4. Test robustezza

### Implementazione

#### 9.1 Stress Test MQTT
File: `cloud/tests/stress-test-mqtt.js`

Test:
- Invio 10.000 eventi in 10 secondi
- Verifica deduplicazione funzionante
- Verifica rate limiting
- Misura latenza media/max

#### 9.2 Test Disconnessioni
File: `cloud/tests/disconnection-test.js`

Scenari:
- Disconnetti braccialetto durante partita
- Riconnetti dopo 5s/30s/1min
- Verifica stato coerente
- Verifica nessuna perdita punteggio

#### 9.3 Test Multi-Campo
File: `cloud/tests/multi-field-test.js`

Scenari:
- 3 sessioni parallele (campo_01, campo_02, campo_03)
- 12 braccialetti totali (4 per campo)
- Eventi simultanei su tutti i campi
- Verifica isolamento sessioni

#### 9.4 Test End-to-End Automatizzato
File: `tests/e2e-test.sh`

Flow completo:
1. Avvia servizi (session, pairing, database, api)
2. Crea sessione via API
3. Simula pairing 4 braccialetti
4. Simula 100 eventi punteggio
5. Termina sessione
6. Verifica salvataggio database
7. Query storico
8. Cleanup
9. Report risultati

---

## 🚀 STEP 10: Deploy

### Obiettivi
1. Configurazione Wi-Fi produzione
2. Documentazione operativa
3. Guide onboarding utenti
4. Monitoring e logging

### Deliverables

#### 10.1 Deployment Guide
File: `DEPLOYMENT.md`

Contenuti:
- Setup Firebase project
- Deploy Cloud Functions
- Configurazione MQTT broker produzione
- Setup Wi-Fi centro sportivo
- Deploy web app (Netlify/Vercel)
- Configurazione ESP32 braccialetti

#### 10.2 User Manual
File: `USER-MANUAL.md`

Contenuti:
- Guida rapida per operatori
- Procedura creazione partita
- Procedura pairing braccialetti
- Risoluzione problemi comuni
- FAQ

#### 10.3 Admin Dashboard
File: `webapp/test/src/pages/AdminDashboard.jsx`

Funzionalità:
- Vista sessioni attive
- Storico partite
- Gestione location
- Statistiche aggregate
- Log sistema

#### 10.4 Monitoring Setup
File: `cloud/monitoring-service.js`

Metriche:
- Sessioni attive
- Eventi/minuto
- Latenza MQTT
- Errori e warning
- Uptime servizi

---

## 🎯 Piano di Lavoro Prioritizzato

### Priorità Alta (Step 7 - Database)
1. ✅ Setup Firestore schema
2. ✅ Implementare database-service.js
3. ✅ Integrare con session-service.js
4. ✅ API REST per query
5. ✅ UI storico partite

**Tempo stimato**: 4-6 ore
**Blocchi**: Nessuno (tutto il necessario è già setup)

### Priorità Media (Step 8 - Sicurezza)
1. ✅ Implementare auth-service.js
2. ✅ Token JWT generation/validation
3. ✅ Integrazione ruoli in web app
4. ✅ UI role selector

**Tempo stimato**: 3-4 ore
**Dipendenze**: Step 7 completato (per proteggere API)

### Priorità Media (Step 9 - Testing)
1. ✅ Script stress test MQTT
2. ✅ Script test disconnessioni
3. ✅ Script test multi-campo
4. ✅ Script E2E automatizzato

**Tempo stimato**: 3-4 ore
**Dipendenze**: Step 7-8 completati

### Priorità Bassa (Step 10 - Deploy)
1. ✅ Documentazione deployment
2. ✅ User manual
3. ✅ Admin dashboard
4. ✅ Monitoring setup

**Tempo stimato**: 2-3 ore
**Dipendenze**: Step 7-9 completati e testati

---

## 🔧 Scelte Tecniche

### Database: Firestore
**Pro**:
- Real-time sync nativo
- Scaling automatico
- Offline support
- SDK già integrato

**Contro**:
- Costi pay-per-use
- Query limitate

**Alternativa**: Supabase (PostgreSQL managed)

### Autenticazione: JWT
**Pro**:
- Stateless
- Standard industry
- Facile validazione

**Contro**:
- No revoca immediata

**Mitigazione**: Short expiry (1h) + refresh token

### Testing: Bash + Node.js
**Pro**:
- Semplice
- Cross-platform
- Nessuna dipendenza extra

**Contro**:
- Meno robusto di framework dedicati

**Futura migrazione**: Jest + Playwright

---

## 📊 Metriche di Successo

### Step 7 (Database)
- ✅ 100% partite salvate correttamente
- ✅ Query storico < 500ms
- ✅ UI carica 50 partite senza lag

### Step 8 (Sicurezza)
- ✅ 0 comandi non autorizzati eseguiti
- ✅ Token validation < 50ms
- ✅ Nessun conflitto tra device

### Step 9 (Testing)
- ✅ Stress test: 10k eventi senza errori
- ✅ Disconnessioni: 0 perdite punteggio
- ✅ Multi-campo: 3+ sessioni stabili

### Step 10 (Deploy)
- ✅ Documentazione completa
- ✅ Setup produzione < 1 ora
- ✅ 95%+ uptime in uso reale

---

## 🚦 Prossimi Passi Immediati

1. **Adesso**: Implementare database-service.js
2. **Poi**: Integrare salvataggio in session-service.js
3. **Poi**: API REST per query storico
4. **Poi**: UI storico nella web app
5. **Test**: Verificare flow completo end-to-end

---

## ❓ Domande Aperte per l'Utente

1. **Database**: Firestore (già setup) o preferisci Supabase?
2. **Autenticazione**: JWT semplice o integrazione Firebase Auth completa?
3. **Deploy target**: Solo locale per ora o anche produzione cloud?
4. **Location**: Quanti campi prevedi di gestire? (per dimensionare test)
5. **Storico**: Quanto storico conservare? (7 giorni, 30 giorni, forever?)
6. **Budget**: Ci sono limiti di costo per Firestore/Firebase?

---

## 🎬 Script di Test Automatizzato (Preview)

```bash
#!/bin/bash
# tests/e2e-full-system-test.sh

echo "🧪 Scorely - Full System E2E Test"
echo "=================================="

# 1. Health check servizi
echo "\n1️⃣ Checking services health..."
./tests/check-services.sh || exit 1

# 2. Test database
echo "\n2️⃣ Testing database operations..."
./tests/test-database.sh || exit 1

# 3. Test session flow
echo "\n3️⃣ Testing session lifecycle..."
./tests/test-session-flow.sh || exit 1

# 4. Test multi-bracelet
echo "\n4️⃣ Testing multi-bracelet pairing..."
./tests/test-multi-bracelet.sh || exit 1

# 5. Test stress MQTT
echo "\n5️⃣ Running MQTT stress test..."
./tests/stress-test.sh || exit 1

# 6. Test disconnections
echo "\n6️⃣ Testing reconnection scenarios..."
./tests/test-disconnections.sh || exit 1

# 7. Test multi-campo
echo "\n7️⃣ Testing multi-field isolation..."
./tests/test-multi-field.sh || exit 1

echo "\n✅ All tests passed!"
echo "📊 Generating report..."
./tests/generate-report.sh
```

---

**Pronto per iniziare con Step 7?** 🚀
