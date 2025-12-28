# Firebase Setup Guide

## 🎯 Obiettivo

Configurare Firebase Firestore per salvare lo storico partite.

---

## 📋 Setup Veloce (5 minuti)

### Opzione A: Firebase Emulator (Local Testing) ⭐ CONSIGLIATA per sviluppo

**Vantaggi**:
- Nessun account Firebase necessario
- Gratis
- Dati in locale
- Perfetto per testing

**Setup**:

```bash
# 1. Installa Firebase Tools globalmente
npm install -g firebase-tools

# 2. Vai nella cartella functions
cd cloud/functions

# 3. Inizializza Firebase Emulator
firebase init emulators

# Scegli: Firestore Emulator
# Port: 8080 (default)

# 4. Avvia l'emulator
firebase emulators:start --only firestore

# Output: Firestore Emulator running on http://localhost:8080
```

**Configurazione database-service.js per emulator**:

```javascript
// Aggiungi all'inizio di database-service.js dopo initializeFirebase()

if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log('🧪 Using Firestore Emulator');
} else if (process.env.NODE_ENV === 'development') {
  // Use emulator in development
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  console.log('🧪 Firestore Emulator enabled (localhost:8080)');
}
```

**Testa**:
```bash
# Terminal 1: Avvia emulator
cd cloud/functions && firebase emulators:start --only firestore

# Terminal 2: Testa database service
cd cloud && node database-service.js
```

---

### Opzione B: Firebase Cloud (Production)

**Vantaggi**:
- Dati persistenti nel cloud
- Sincronizzazione real-time
- Backup automatico

**Svantaggi**:
- Richiede account Google
- Pay-per-use (ma free tier generoso)

**Setup**:

```bash
# 1. Crea progetto Firebase
# Vai su https://console.firebase.google.com/
# Click "Add project"
# Nome progetto: "scorely-iot"
# Click "Continue" e segui wizard

# 2. Abilita Firestore
# Nel progetto, vai su "Build" → "Firestore Database"
# Click "Create database"
# Scegli "Start in test mode" (per ora)
# Location: eur3 (Europe)
# Click "Enable"

# 3. Scarica Service Account Key
# Project Settings → Service Accounts
# Click "Generate new private key"
# Salva come: cloud/firebase-service-account.json

# 4. Configura ambiente
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/scorely/cloud/firebase-service-account.json"

# Oppure crea .env file:
echo "GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json" > cloud/.env
```

**Testa**:
```bash
cd cloud && node database-service.js
```

---

## 🧪 Test Rapido

Una volta configurato (emulator o cloud), testa:

```javascript
// test-database.js
const db = require('./database-service');

async function test() {
  // 1. Crea location
  await db.createLocation({
    id: 'campo_01',
    name: 'Campo Principale',
    address: 'Via dello Sport 1'
  });

  // 2. Salva match di test
  const matchId = await db.saveMatch({
    sessionId: 'TEST123',
    locationId: 'campo_01',
    startTime: Date.now() - 600000, // 10 minuti fa
    endTime: Date.now(),
    finalScore: { team1: 12, team2: 9 },
    pairedDevices: [
      { deviceId: 'bracelet_01', team: 1 },
      { deviceId: 'bracelet_02', team: 2 }
    ],
    totalEvents: 21
  });

  console.log('Match saved:', matchId);

  // 3. Recupera match
  const match = await db.getMatchById(matchId);
  console.log('Match retrieved:', match);

  // 4. Recupera storico
  const history = await db.getMatchHistory({ locationId: 'campo_01' });
  console.log('Match history:', history.length, 'matches');

  // 5. Statistiche
  const stats = await db.getLocationStats('campo_01');
  console.log('Stats:', stats);
}

test();
```

Salva come `cloud/test-database.js` ed esegui:
```bash
cd cloud && node test-database.js
```

---

## 🔧 Configurazione Consigliata

### Per Sviluppo Locale

Usa **Firebase Emulator**:

```bash
# .env
FIRESTORE_EMULATOR_HOST=localhost:8080
NODE_ENV=development
```

### Per Produzione

Usa **Firebase Cloud**:

```bash
# .env
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
NODE_ENV=production
```

---

## 📊 Schema Firestore

```
scorely/
├── locations/
│   ├── campo_01/
│   │   ├── name: "Campo Principale"
│   │   ├── address: "Via dello Sport 1"
│   │   ├── active: true
│   │   └── createdAt: timestamp
│   └── campo_02/
│       └── ...
└── matches/
    ├── {auto-generated-id}/
    │   ├── sessionId: "ABC123"
    │   ├── locationId: "campo_01"
    │   ├── startTime: timestamp
    │   ├── endTime: timestamp
    │   ├── duration: 600 (seconds)
    │   ├── finalScore: { team1: 12, team2: 9 }
    │   ├── winner: "team1"
    │   ├── pairedDevices: [...]
    │   ├── totalEvents: 21
    │   └── createdAt: timestamp
    └── ...
```

---

## 🚀 Prossimi Passi

Una volta che Firebase è configurato:

1. ✅ database-service.js funziona
2. ⏭️ Integrare in session-service.js
3. ⏭️ Creare API REST
4. ⏭️ UI per visualizzare storico

---

## ❓ Troubleshooting

### Errore: "Failed to initialize Firebase"

**Soluzione**: Verifica che:
- GOOGLE_APPLICATION_CREDENTIALS punta al file corretto
- Il file service-account.json esiste
- Oppure usa emulator: `export FIRESTORE_EMULATOR_HOST=localhost:8080`

### Errore: "Permission denied"

**Soluzione**:
- Se usi Cloud: Cambia regole Firestore in test mode
- Se usi Emulator: Non serve autenticazione

### Emulator non parte

**Soluzione**:
```bash
# Verifica installazione
firebase --version

# Reinstalla se necessario
npm install -g firebase-tools

# Init di nuovo
cd cloud/functions
firebase init emulators
```

---

## 📝 Note

- **Free Tier Firebase**: 1GB storage, 50k letture/giorno, 20k scritture/giorno
- **Emulator**: Dati cancellati ad ogni riavvio (usa `--export` per persistere)
- **Production**: Configura backup automatici in Firebase Console

---

**Pronto per continuare? Dimmi quando Firebase è configurato!** 🚀
