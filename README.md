📘 Documentazione Progetto – Sistema di Punteggio Sportivo IoT (v2)
1️⃣ Introduzione
Il progetto prevede lo sviluppo di un sistema di punteggio elettronico IoT per centri sportivi, progettato per essere device‑agnostic, modulare e altamente scalabile.
Il sistema consente di gestire partite sportive con aggiornamento del punteggio in tempo reale utilizzando: - Braccialetti / telecomandi ESP32 come input fisico - Qualsiasi dispositivo con browser (iPad, iPhone, tablet, PC) come tabellone - Tabellone ESP32 con display come dispositivo opzionale - Infrastruttura cloud come unica fonte di verità
👉 Il concetto chiave è che la sessione di gioco vive nel cloud, non su un dispositivo specifico.

2️⃣ Obiettivi del sistema
Aggiornamento punteggio real‑time
Input multipli: fisico (ESP32) e digitale (Web App)
Visualizzazione punteggio su qualsiasi dispositivo
Pairing dei braccialetti rapido e senza configurazioni manuali
Persistenza storica delle partite per location
Funzionamento con o senza tabellone ESP32
Architettura pronta per ambienti reali e multi‑campo

3️⃣ Concetti fondamentali
3.1 Sessione di gioco (core del sistema)
La sessione è l’entità centrale del sistema.
Una sessione contiene:
{
  "sessionId": "ABC123",
  "locationId": "campo_01",
  "status": "waiting | running | ended",
  "pairingOpen": true,
  "pairingExpiresAt": 1700000000,
  "score": {
    "team1": 0,
    "team2": 0
  }
}
La sessione: - esiste nel cloud - è indipendente dai dispositivi - può essere ripresa da qualsiasi client autorizzato

3.2 Tipologie di dispositivi
Dispositivo
Ruolo
Note
Braccialetto ESP32
input
invia eventi di punteggio
Web App (iPad/iPhone/Browser)
display / controller
tabellone principale
ESP32 Tabellone
display
opzionale
Browser Admin
admin
gestione location e storico


4️⃣ Architettura di sistema
[Braccialetti ESP32]
        |
        | MQTT (Wi‑Fi)
        v
[Broker MQTT Cloud] <─── MQTT over WSS ───> [Web App (iPad / iPhone / Browser)]
        |
        | MQTT
        v
[Tabellone ESP32] (opzionale)
        |
        v
[Cloud DB – Storico Partite]
Tutti i dispositivi sono client MQTT
Il cloud è la single source of truth

5️⃣ Tecnologie utilizzate
Componente
Tecnologia
Note
Braccialetti ESP32
Arduino / ESP‑IDF
Pulsanti + / −
Tabellone ESP32
Arduino / ESP‑IDF
OLED / TFT
Broker MQTT
HiveMQ Cloud / Mosquitto
TLS
Web App
React + Tailwind CSS
MQTT over WebSocket
Cloud DB
Firebase Firestore / Supabase
Storico partite
QR Code
Libreria ESP32 / JS
Accesso rapido sessione


6️⃣ Comunicazioni MQTT
6.1 Topic principali
pairing/request
pairing/response/{deviceId}
session/{sessionId}/event
session/{sessionId}/state
session/{sessionId}/command

6.2 Eventi di punteggio
Topic: session/ABC123/event
{
  "type": "score",
  "action": "increment",
  "team": 1,
  "deviceId": "bracelet_001",
  "timestamp": 1700000001
}

6.3 Snapshot di stato (state)
Topic: session/ABC123/state
{
  "team1": 12,
  "team2": 9,
  "status": "running"
}
Lo snapshot viene pubblicato: - all’avvio sessione - a ogni modifica punteggio - su richiesta di un nuovo client

7️⃣ Pairing dei braccialetti
7.1 Attivazione pairing
L’utente apre una sessione da Web App o tabellone ESP32
Il pairing è aperto per 30–60 secondi
{
  "pairingOpen": true,
  "pairingExpiresAt": 1700000060
}

7.2 Braccialetto → richiesta pairing
Premendo + e − contemporaneamente:
Topic: pairing/request
{
  "deviceId": "bracelet_001",
  "sessionId": "ABC123"
}

7.3 Cloud → risposta pairing
Topic: pairing/response/bracelet_001
{
  "status": "ok",
  "topic": "session/ABC123/event",
  "team": 1
}
Il braccialetto: - salva il topic in EEPROM / LittleFS - invia solo eventi di gioco

8️⃣ Web App
Funzionalità principali
Creazione sessione
Visualizzazione punteggi live
Funzione tabellone
Controllo partita (start / stop / reset)
Storico partite per location
Connessione
MQTT over WebSocket (WSS)
Ricezione eventi e snapshot

9️⃣ Tabellone ESP32 (opzionale)
Client MQTT come la Web App
Nessun ruolo centrale
Solo display real‑time
Può essere acceso/spento senza impatti

🔐 10️⃣ Sicurezza e affidabilità
MQTT su TLS / WSS
Session ID univoco
Pairing temporizzato
Ruoli dei client
Riconnessione automatica
Persistenza stato su cloud

📈 11️⃣ Scalabilità
Multi‑campo
Multi‑tabellone
Multi‑braccialetto per squadra
Nessun limite di device viewer

🧭 12️⃣ Roadmap
Fase
Attività
Output
1
Setup ESP32
Input funzionante
2
MQTT Cloud
Comunicazione stabile
3
Web App
Tabellone universale
4
Pairing
Associazione rapida
5
Snapshot state
Robustezza
6
Testing reale
Produzione


✅ Conclusione
Questo sistema: - funziona con o senza hardware dedicato - è robusto in ambienti reali - è pronto per essere prodotto e scalato
👉 La sessione è il cuore del sistema.
