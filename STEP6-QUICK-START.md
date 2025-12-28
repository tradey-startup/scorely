# Quick Start - Step 6 UX Flow

## Setup Rapido (3 terminali)

### Terminale 1: Session Service
```bash
cd /Users/lorenzocastelli/projects/scorely/cloud
node session-service.js
```

### Terminale 2: Pairing Service
```bash
cd /Users/lorenzocastelli/projects/scorely/cloud
node pairing-service.js
```

### Terminale 3: Web App
```bash
cd /Users/lorenzocastelli/projects/scorely/webapp/test
npm run dev
```

Apri: **http://localhost:5174/**

---

## Flow Utente

1. **Welcome** → Clicca "Crea Nuova Partita"
2. **QR Code** → Attendi 2s (auto-transizione)
3. **Pairing** → 60s countdown
   - Opzione A: Usa braccialetti ESP32 reali
   - Opzione B: Simula con script (vedi sotto)
   - Opzione C: Clicca "Salta Pairing"
4. **Ready** → Clicca "Inizia Partita"
5. **Match** → Gioca!

---

## Simulazione Braccialetti (Test)

In un **4° terminale**, dopo aver creato la sessione (es. `ABC123`):

```bash
cd /Users/lorenzocastelli/projects/scorely/cloud

# Con SESSION_ID specifico
node test-multi-bracelet.js ABC123

# Oppure usa il default (6BGTB0)
node test-multi-bracelet.js
```

**Altri script di test con SESSION_ID:**
```bash
# Test pairing
node test-pairing.js ABC123

# Test session completo
node test-session.js ABC123
```

Questo simula 4 braccialetti che:
1. Fanno pairing (2 per team)
2. Inviano eventi di punteggio random

---

## Verifica Funzionalità

### ✅ Checklist
- [ ] QR code visualizzato correttamente
- [ ] Countdown pairing 60s → 0s
- [ ] Braccialetti appaiono in Team 1/Team 2
- [ ] Pulsante "Inizia Partita" funziona
- [ ] Punteggi si aggiornano in tempo reale
- [ ] Pulsante "Termina" mostra vincitore
- [ ] Pulsante "Reset" azzera punteggi
- [ ] Log MQTT collassabili

---

## Troubleshooting

### La web app non si connette a MQTT
- Verifica che i servizi cloud siano attivi
- Controlla credenziali in `webapp/test/src/config/mqtt.js`

### I braccialetti non appaiono
- Verifica che il Session ID sia corretto
- Controlla che il pairing sia ancora aperto (<60s)
- Guarda i log MQTT nella web app

### QR code non funziona
- Assicurati che l'URL sia accessibile dal dispositivo
- Usa localhost solo per test locali
- Per dispositivi esterni, usa l'IP del PC

---

## Prossimo Step

**Step 7**: Storico partite & location
- Salvataggio partite su Firebase/Firestore
- Query per location
- Visualizzazione statistiche
