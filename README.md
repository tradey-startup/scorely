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


RODMAP

🧭 Roadmap di Sviluppo – Sistema di Punteggio Sportivo IoT
Questa documentazione descrive l’ordine corretto e progressivo per sviluppare l’intero sistema, evitando refactor inutili e garantendo stabilità fin dalle prime fasi.
👉 Regola base: ogni step deve funzionare da solo prima di passare al successivo.

🔰 STEP 0 – Preparazione ambiente
Obiettivo
Avere un ambiente di sviluppo pronto e coerente per tutti i componenti.
Attività OK
Creazione repository (monorepo consigliato)
Setup Broker MQTT (HiveMQ Cloud o Mosquitto)
Creazione struttura progetto
/scorely
 ├── cloud/
 ├── webapp/
 └── esp32/
Output atteso
Broker MQTT raggiungibile
Credenziali MQTT funzionanti

🧠 STEP 1 – Core del sistema: Sessione & Stato
Obiettivo
Costruire il cuore logico del sistema: la sessione di gioco.
Attività
Definizione modello Sessione
Implementazione topic MQTT principali
Gestione eventi e snapshot di stato
Topic MQTT
session/{sessionId}/event
session/{sessionId}/state   (retained)
Regola chiave
Se chiudi tutti i device, la sessione deve continuare a esistere.
Output atteso
Invio evento → aggiornamento stato
Snapshot sempre coerente

🌐 STEP 2 – Web App minimale (Tabellone universale)
Obiettivo
Trasformare qualsiasi browser in un tabellone funzionante.
Attività
Setup React (Vite)
Connessione MQTT over WebSocket
Visualizzazione punteggio in tempo reale
Funzionalità minime
Mostra punteggio
Bottone Start / End partita
Log eventi MQTT (debug)
Output atteso
Il punteggio cambia in tempo reale
Ricaricando la pagina lo stato è corretto

🔗 STEP 3 – Pairing base (1 braccialetto)
Obiettivo
Associare un solo braccialetto a una sessione.
Attività
ESP32: Wi-Fi + MQTT
Gestione pulsanti + / −
Implementazione pairing MQTT
Topic pairing
pairing/request
pairing/response/{deviceId}
Test critico
Premi + e −
Ricevi topic
Premi + → punteggio cambia sul browser
Output atteso
Pairing stabile
Topic salvato in EEPROM / LittleFS

🧩 STEP 4 – Stato persistente & riconnessioni
Obiettivo
Garantire robustezza in scenari reali.
Attività
Salvataggio stato su Cloud DB
Pubblicazione snapshot su riconnessione
Gestione riconnessione ESP32
Test
Spegni Wi-Fi
Ricarica Web App
Riaccendi ESP32
Output atteso
Nessuna perdita di punteggio

👥 STEP 5 – Multi-braccialetto & Team
Obiettivo
Gestire partite reali con più giocatori.
Attività
Assegnazione team durante pairing
Gestione più input simultanei
Protezione da duplicazioni
Regole
Un braccialetto = un team
Eventi idempotenti
Output atteso
4 braccialetti funzionano insieme

📱 STEP 6 – UX reale (flow completo)
Obiettivo
Riprodurre esattamente l’esperienza dell’utente finale.
Attività
Creazione partita
QR code sessione
Pairing temporizzato
Start / End partita
Test reale
Tablet / iPad
4 persone
Wi-Fi instabile
Output atteso
Esperienza fluida e intuitiva

🧾 STEP 7 – Storico partite & location
Obiettivo
Persistenza e consultazione dati.
Attività
Salvataggio partita a fine match
Query per location
Visualizzazione storico
Output atteso
Lista partite
Dettaglio punteggi

🔐 STEP 8 – Sicurezza & ruoli
Obiettivo
Prevenire errori e accessi indesiderati.
Attività
Ruoli client (display, controller, admin)
Token sessione
Limitazione comandi critici
Output atteso
Nessun conflitto tra device

🧪 STEP 9 – Testing & hardening
Obiettivo
Portare il sistema a livello produzione.
Attività
Stress test MQTT
Simulazione disconnessioni
Test multi-campo
Output atteso
Sistema stabile in uso reale

🚀 STEP 10 – Deploy
Obiettivo
Installazione nel centro sportivo.
Attività
Configurazione Wi-Fi definitiva
Documentazione operativa
Onboarding utenti
Output finale
✅ Sistema pronto per partite reali

🏁 Conclusione
Seguendo questi step: - non riscrivi codice - non crei dipendenze inutili - costruisci un prodotto solido
👉 Il cloud e la sessione vengono prima di tutto il resto.

