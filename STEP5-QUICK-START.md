# 🚀 STEP 5 - Quick Start Guide

## ⚡ Avvio Rapido (3 Terminali)

### Terminal 1: Session Service
```bash
cd cloud
node session-service.js
```

### Terminal 2: Pairing Service
```bash
cd cloud
node pairing-service.js
```

### Terminal 3: Test Script
```bash
cd cloud
node test-multi-bracelet.js
```

Oppure usa lo script helper:
```bash
cd cloud
./run-step5-test.sh
```

---

## 🎮 Test Sequence Veloce

Nel Terminal 3 (test script), digita in sequenza:

```
1  ← Start session
2  ← Open pairing
3  ← Pair 4 virtual bracelets
4  ← Test concurrent events
5  ← Test duplicate prevention
6  ← Test rate limiting
s  ← Show current state
q  ← Quit
```

---

## ✅ Output Atteso

### Dopo opzione 3 (Pair 4 bracelets):
```
👥 Paired Devices (4):
   Team 1 (2):
     - virtual_bracelet_01
     - virtual_bracelet_03
   Team 2 (2):
     - virtual_bracelet_02
     - virtual_bracelet_04
```

### Dopo opzione 4 (Concurrent events):
```
Score: Team 1: 2 - Team 2: 2
```

### Dopo opzione 5 (Duplicate prevention):
```
⚠️  DUPLICATE EVENT DETECTED - Ignoring (x2 volte)
Score aumenta di 1 solo
```

### Dopo opzione 6 (Rate limiting):
```
⚠️  RATE LIMIT EXCEEDED - Ignoring (x5 volte)
Score aumenta di 10 max
```

---

## 🔧 Troubleshooting Rapido

### "Cannot find module 'mqtt'"
```bash
cd cloud
npm install
```

### Session service non riceve eventi
- Verifica che sia running (Terminal 1)
- Controlla che sia subscribed a `session/+/event`

### Pairing non funziona
- Verifica che pairing-service sia running (Terminal 2)
- Controlla che pairing sia aperto (opzione 2 nel test)

### Test script non si connette
- Verifica credenziali MQTT in `test-multi-bracelet.js`
- Controlla connessione internet

---

## 📚 Documentazione Completa

- **Guida dettagliata**: [STEP5-MULTI-BRACELET-GUIDE.md](STEP5-MULTI-BRACELET-GUIDE.md)
- **Riepilogo**: [STEP5-SUMMARY.md](STEP5-SUMMARY.md)
- **README principale**: [README.md](README.md)

---

## 🎯 Funzionalità STEP 5

✅ Event deduplication (anti-duplicati)
✅ Rate limiting (anti-spam)
✅ Multi-bracelet support (fino a 4)
✅ Team balancing automatico
✅ Paired devices tracking
✅ Concurrent events handling

---

**Pronto per testare? Avvia i 3 terminali e inizia! 🚀**
