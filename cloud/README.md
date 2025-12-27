# Scorely Cloud Backend

Cloud Functions backend per il sistema di punteggio sportivo IoT.

## Stack Tecnologico

- **Firebase Functions**: Serverless functions per gestione logica backend
- **Firestore**: Database NoSQL per persistenza sessioni e storico
- **HiveMQ Cloud**: Broker MQTT per comunicazione real-time
- **TypeScript**: Linguaggio di sviluppo

## Struttura del Progetto

```
cloud/
├── firebase.json              # Configurazione Firebase
├── .firebaserc               # Progetti Firebase
├── firestore.rules           # Regole di sicurezza Firestore
├── firestore.indexes.json    # Indici database
└── functions/
    ├── package.json          # Dipendenze npm
    ├── tsconfig.json         # Configurazione TypeScript
    ├── .env.example          # Template variabili ambiente
    └── src/
        ├── index.ts          # Cloud Functions endpoints
        ├── types/
        │   └── session.types.ts    # TypeScript types
        ├── config/
        │   └── mqtt.config.ts      # Configurazione MQTT
        └── services/
            ├── mqtt.service.ts     # Servizio MQTT
            └── session.service.ts  # Logica sessioni
```

## Setup Iniziale

### 1. Installa Dipendenze

```bash
cd functions
npm install
```

### 2. Configura Firebase

Se non hai ancora un progetto Firebase:

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuovo progetto
3. Abilita Firestore
4. Abilita Firebase Functions

Poi collega il progetto locale:

```bash
# Login Firebase
npx firebase login

# Seleziona il progetto
npx firebase use --add
```

Modifica `.firebaserc` con il tuo project ID.

### 3. Configura MQTT (HiveMQ Cloud)

Crea un file `.env` nella cartella `functions/`:

```bash
cp functions/.env.example functions/.env
```

Inserisci le tue credenziali HiveMQ Cloud:

```env
MQTT_HOST=your-cluster.hivemq.cloud
MQTT_PORT=8883
MQTT_PROTOCOL=mqtts
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
```

Per la produzione, configura le variabili tramite Firebase CLI:

```bash
firebase functions:config:set \
  mqtt.host="your-cluster.hivemq.cloud" \
  mqtt.port="8883" \
  mqtt.protocol="mqtts" \
  mqtt.username="your-username" \
  mqtt.password="your-password"
```

## Sviluppo Locale

### Avvia Emulatori Firebase

```bash
cd functions
npm run serve
```

Questo avvia:
- Functions Emulator su `http://localhost:5001`
- Firestore Emulator su `http://localhost:8080`
- Emulator UI su `http://localhost:4000`

### Build TypeScript

```bash
npm run build
```

### Build Watch Mode

```bash
npm run build:watch
```

## Cloud Functions Disponibili

### `createSession`

Crea una nuova sessione di gioco.

**Endpoint**: `POST /createSession`

**Body**:
```json
{
  "locationId": "campo_01",
  "metadata": {
    "sport": "padel",
    "maxScore": 21
  }
}
```

**Response**:
```json
{
  "success": true,
  "session": {
    "sessionId": "ABC123",
    "locationId": "campo_01",
    "status": "waiting",
    "score": { "team1": 0, "team2": 0 },
    ...
  }
}
```

### `getSession`

Ottiene una sessione esistente.

**Endpoint**: `GET /getSession?sessionId=ABC123`

### `startSession`

Avvia una sessione (cambia stato da `waiting` a `running`).

**Endpoint**: `POST /startSession`

**Body**:
```json
{
  "sessionId": "ABC123"
}
```

### `endSession`

Termina una sessione e salva nello storico.

**Endpoint**: `POST /endSession`

**Body**:
```json
{
  "sessionId": "ABC123"
}
```

### `pairDevice`

Associa un dispositivo ESP32 a una sessione.

**Endpoint**: `POST /pairDevice`

**Body**:
```json
{
  "sessionId": "ABC123",
  "deviceId": "bracelet_001",
  "team": 1
}
```

### `processScoreEvent`

Processa un evento di punteggio.

**Endpoint**: `POST /processScoreEvent`

**Body**:
```json
{
  "sessionId": "ABC123",
  "event": {
    "type": "score",
    "action": "increment",
    "team": 1,
    "deviceId": "bracelet_001",
    "timestamp": 1700000001
  }
}
```

## Deploy in Produzione

### Deploy Firestore Rules & Indexes

```bash
firebase deploy --only firestore
```

### Deploy Functions

```bash
cd functions
npm run deploy
```

Oppure deploy tutto:

```bash
firebase deploy
```

## Testing

### Test con curl

```bash
# Crea sessione
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/createSession \
  -H "Content-Type: application/json" \
  -d '{"locationId":"campo_01"}'

# Ottieni sessione
curl "http://localhost:5001/YOUR_PROJECT/us-central1/getSession?sessionId=ABC123"

# Avvia sessione
curl -X POST http://localhost:5001/YOUR_PROJECT/us-central1/startSession \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"ABC123"}'
```

## MQTT Topics

Il sistema usa questi topic MQTT:

- `session/{sessionId}/event` - Eventi di punteggio dai braccialetti
- `session/{sessionId}/state` - Snapshot stato (RETAINED)
- `session/{sessionId}/command` - Comandi di controllo
- `pairing/request` - Richieste pairing dai dispositivi
- `pairing/response/{deviceId}` - Risposte pairing

## Flow Completo

1. **Creazione Sessione**: Web App chiama `createSession` → Firestore + MQTT state snapshot
2. **Pairing**: Braccialetto invia `pairing/request` → Backend risponde con topic
3. **Avvio**: Web App chiama `startSession` → Status = running
4. **Evento Score**: Braccialetto → MQTT event → `processScoreEvent` → Firestore + MQTT state
5. **Fine**: Web App chiama `endSession` → Salvataggio storico

## Note Importanti

- **State Snapshot**: Usa `retain: true` per garantire che nuovi client ricevano lo stato corrente
- **Idempotenza**: Gli eventi score devono essere idempotenti
- **Sicurezza**: Le regole Firestore vanno rafforzate in produzione con autenticazione
- **Scalabilità**: Firebase Functions scala automaticamente

## Troubleshooting

### MQTT non si connette

- Verifica credenziali HiveMQ in `.env`
- Controlla che il cluster HiveMQ sia attivo
- Verifica firewall/porta 8883

### Functions non deployano

- `npm run build` per verificare errori TypeScript
- Controlla quota Firebase Functions
- Verifica autenticazione: `firebase login`

### Firestore permission denied

- Controlla `firestore.rules`
- In sviluppo puoi usare regole permissive (solo per test!)
