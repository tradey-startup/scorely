# 🚀 Scorely - Deployment Guide

Guida completa per il deploy del sistema Scorely in produzione.

---

## 📋 Prerequisiti

### Hardware Minimo

**Server/Computer:**
- CPU: 2 core
- RAM: 4GB
- Storage: 10GB
- Network: Connessione stabile internet

**Braccialetti ESP32:**
- 4+ braccialetti ESP32 configurati
- Alimentazione (batterie o USB)
- WiFi access

**Display (opzionale):**
- Tablet, iPad, o monitor con browser moderno
- Risoluzione minima: 1024x768

### Software Richiesto

- **Node.js**: v18+ ([download](https://nodejs.org))
- **npm**: v9+ (incluso con Node.js)
- **Git**: Per clonare repository
- **Firebase CLI**: `npm install -g firebase-tools`
- **Browser moderno**: Chrome, Firefox, Safari, Edge

---

## 🏗️ Opzioni di Deployment

### Opzione A: Deployment Locale (Consigliata per testing)

**Ideale per:**
- Test e sviluppo
- Single location
- Setup rapido
- Nessun costo cloud

**Architettura:**
```
┌─────────────────────────────────────────┐
│  Computer Locale (Server)               │
│  ├─ Node.js Services                    │
│  ├─ Firebase Emulator                   │
│  └─ Web App (Vite dev)                  │
└─────────────────────────────────────────┘
         │
    WiFi LAN
         │
┌─────────────────────────────────────────┐
│  Devices (WiFi)                         │
│  ├─ ESP32 Braccialetti → MQTT Cloud    │
│  ├─ Tablet Display                      │
│  └─ Smartphone Controller               │
└─────────────────────────────────────────┘
```

**Passi:**
1. Clone repository
2. Install dependencies
3. Start Firebase Emulator
4. Start services
5. Access web app

### Opzione B: Cloud Deployment (Produzione)

**Ideale per:**
- Produzione
- Multi-location
- Accesso remoto
- Scaling automatico

**Architettura:**
```
┌─────────────────────────────────────────┐
│  Firebase Cloud                         │
│  ├─ Firestore Database                  │
│  ├─ Cloud Functions (API)               │
│  └─ Hosting (Web App)                   │
└─────────────────────────────────────────┘
         │
    Internet
         │
┌─────────────────────────────────────────┐
│  HiveMQ Cloud MQTT Broker               │
└─────────────────────────────────────────┘
         │
┌─────────────────────────────────────────┐
│  Devices (WiFi/Mobile)                  │
│  ├─ ESP32 Braccialetti                  │
│  ├─ Tablet Display                      │
│  └─ Smartphone Controller               │
└─────────────────────────────────────────┘
```

**Passi:**
1. Setup Firebase project
2. Deploy Cloud Functions
3. Deploy Web App
4. Configure devices

### Opzione C: Hybrid (Bilanciata)

**Ideale per:**
- Produzione con controllo locale
- Backup locale
- Latenza ridotta

**Mix:**
- Database: Firebase Cloud
- MQTT: HiveMQ Cloud
- Services: Server locale (Docker)
- Web App: Firebase Hosting

---

## 🔧 Setup Passo-Passo

### 1. Clone Repository

```bash
cd /path/to/your/projects
git clone https://github.com/your-org/scorely.git
cd scorely
```

### 2. Install Dependencies

```bash
# Backend services
cd cloud
npm install

# Web app
cd ../webapp/test
npm install

# Torna alla root
cd ../..
```

### 3. Configurazione Environment

**Crea file `.env` in `cloud/`:**

```bash
# cloud/.env

# MQTT Configuration (HiveMQ Cloud)
MQTT_HOST=25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud
MQTT_PORT=8883
MQTT_USERNAME=admin
MQTT_PASSWORD=Scorely_test1

# JWT Secret (CAMBIA IN PRODUZIONE!)
JWT_SECRET=your_super_secret_key_min_32_characters_long

# PINs (CAMBIA IN PRODUZIONE!)
CONTROLLER_PIN=1234
ADMIN_PIN=9999

# API Port
API_PORT=3001

# Firebase (se usi cloud)
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json

# Environment
NODE_ENV=production
```

**Crea file `.env` in `webapp/test/`:**

```bash
# webapp/test/.env

# API URL
VITE_API_URL=http://localhost:3001

# Se deploy su Firebase Hosting
# VITE_API_URL=https://your-project.cloudfunctions.net/api
```

### 4. Firebase Setup (se usi cloud)

**A. Crea progetto Firebase:**

1. Vai su [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Nome: `scorely-production`
4. Abilita Google Analytics (opzionale)
5. Click "Create Project"

**B. Abilita Firestore:**

1. Sidebar → Build → Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Location: europe-west (o più vicina a te)
5. Click "Enable"

**C. Configura regole Firestore:**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Locations: read all, write admin only
    match /locations/{locationId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.role == 'admin';
    }

    // Matches: read all, write services only
    match /matches/{matchId} {
      allow read: if true;
      allow create: if true; // Services can create
      allow delete: if request.auth != null && request.auth.token.role == 'admin';
    }
  }
}
```

**D. Download service account:**

1. Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `cloud/firebase-service-account.json`
4. **NON committare questo file!**

**E. Initialize Firebase CLI:**

```bash
cd cloud
firebase login
firebase init

# Selezioni:
# - Firestore
# - Hosting
# - Functions (Node.js)

# Firestore setup:
# - Usa firestore.rules esistente
# - Usa firestore.indexes.json esistente

# Functions setup:
# - JavaScript
# - ESLint: No
# - npm install: Yes

# Hosting setup:
# - Public directory: ../webapp/test/dist
# - Single-page app: Yes
# - GitHub deploys: No
```

### 5. Start Services (Locale)

**Terminal 1 - Firebase Emulator:**
```bash
cd cloud
firebase emulators:start --only firestore
```

**Terminal 2 - Session Service:**
```bash
cd cloud
node session-service.js
```

**Terminal 3 - Pairing Service:**
```bash
cd cloud
node pairing-service.js
```

**Terminal 4 - API Service:**
```bash
cd cloud
node api-service.js
```

**Terminal 5 - Web App:**
```bash
cd webapp/test
npm run dev
```

**Accedi:** http://localhost:5173

### 6. Deploy Cloud (Produzione)

**A. Build Web App:**
```bash
cd webapp/test
npm run build
# Output: dist/ folder
```

**B. Deploy Firebase:**
```bash
cd cloud

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Hosting (Web App)
firebase deploy --only hosting

# Deploy Functions (se usi Cloud Functions)
firebase deploy --only functions
```

**C. Verifica deploy:**
```bash
firebase hosting:channel:deploy preview
# Test URL: https://your-project--preview-xxx.web.app
```

**D. Deploy produzione:**
```bash
firebase deploy --only hosting
# Live URL: https://your-project.web.app
```

---

## 🐳 Docker Deployment (Opzionale)

### Dockerfile Backend

```dockerfile
# cloud/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "api-service.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./cloud
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - MQTT_HOST=${MQTT_HOST}
    restart: unless-stopped

  session:
    build: ./cloud
    command: node session-service.js
    environment:
      - MQTT_HOST=${MQTT_HOST}
    restart: unless-stopped

  pairing:
    build: ./cloud
    command: node pairing-service.js
    environment:
      - MQTT_HOST=${MQTT_HOST}
    restart: unless-stopped
```

**Deploy con Docker:**
```bash
docker-compose up -d
```

---

## 📱 Configurazione Braccialetti ESP32

### 1. Flash Firmware

```cpp
// config.h
#define WIFI_SSID "Your_WiFi_SSID"
#define WIFI_PASSWORD "Your_WiFi_Password"

#define MQTT_SERVER "25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud"
#define MQTT_PORT 8883
#define MQTT_USER "admin"
#define MQTT_PASS "Scorely_test1"

#define DEVICE_ID "bracelet_01" // Unique per device
```

### 2. Test Connessione

1. Open Serial Monitor (115200 baud)
2. Power on bracelet
3. Verifica output:
```
Connecting to WiFi...
WiFi connected!
IP: 192.168.1.100
Connecting to MQTT...
MQTT connected!
Device ID: bracelet_01
Ready to pair!
```

### 3. Pairing

1. Web App → Nuova Partita
2. Click "Apri Pairing (60s)"
3. Press button on bracelet
4. Check web app: "Bracelet_01 paired to Team 1"

---

## 🔒 Sicurezza Produzione

### 1. Cambia Secrets

**JWT Secret:**
```bash
# Genera secret sicuro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Usa output in .env
JWT_SECRET=abcdef1234567890...
```

**PINs:**
```bash
# .env
CONTROLLER_PIN=your_new_4_digit_pin
ADMIN_PIN=your_new_4_digit_pin
```

### 2. HTTPS/SSL

**Opzione A: Firebase Hosting** (automatico)
- SSL automatico
- Certificate management
- CDN globale

**Opzione B: Nginx Reverse Proxy**
```nginx
server {
    listen 443 ssl;
    server_name scorely.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5173;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }
}
```

**Opzione C: Let's Encrypt**
```bash
sudo apt install certbot
sudo certbot --nginx -d scorely.yourdomain.com
```

### 3. Firewall Rules

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # API (se esposto)
sudo ufw enable
```

### 4. Environment Variables

**NON committare:**
- `.env` files
- `firebase-service-account.json`
- PINs
- Passwords
- API keys

**Aggiungi a `.gitignore`:**
```
.env
.env.local
.env.production
firebase-service-account.json
*.log
```

---

## 📊 Monitoring & Logs

### 1. Application Logs

**PM2 Process Manager (consigliato):**
```bash
# Install PM2
npm install -g pm2

# Start services
pm2 start cloud/session-service.js --name session
pm2 start cloud/pairing-service.js --name pairing
pm2 start cloud/api-service.js --name api

# View logs
pm2 logs

# Monitor
pm2 monit

# Auto-restart on boot
pm2 startup
pm2 save
```

### 2. Firebase Monitoring

1. Firebase Console → Analytics
2. Performance Monitoring
3. Crashlytics (se mobile app)

### 3. Custom Monitoring

**Healthcheck endpoint:**
```bash
# Cron job ogni 5 minuti
*/5 * * * * curl -f http://localhost:3001/health || systemctl restart scorely-api
```

---

## 🔄 Updates & Maintenance

### Update Code

```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd cloud && npm install
cd ../webapp/test && npm install

# Rebuild web app
cd webapp/test
npm run build

# Restart services
pm2 restart all

# Or with Docker
docker-compose down
docker-compose build
docker-compose up -d
```

### Database Backup

```bash
# Firestore backup
gcloud firestore export gs://your-bucket/backups/$(date +%Y%m%d)

# Restore
gcloud firestore import gs://your-bucket/backups/20241228
```

---

## ✅ Deployment Checklist

### Pre-Deploy

- [ ] Tutti i test passano (`./tests/run-all-tests.sh`)
- [ ] Environment variables configurate
- [ ] Secrets cambiati (JWT, PINs)
- [ ] Firebase project creato
- [ ] Service account downloaded
- [ ] Web app buildata (`npm run build`)
- [ ] `.gitignore` aggiornato

### Deploy

- [ ] Firebase Firestore rules deployed
- [ ] Web app deployed (Hosting)
- [ ] API service deployed (Functions o server)
- [ ] DNS configurato (se custom domain)
- [ ] SSL attivo
- [ ] Firewall configurato

### Post-Deploy

- [ ] Health check API: `curl https://your-domain.com/health`
- [ ] Login test: Try all 3 roles
- [ ] Create test match
- [ ] Pair test bracelet
- [ ] Verify score updates
- [ ] Check database save
- [ ] View match history
- [ ] Test da mobile

### Monitoring

- [ ] PM2 running (`pm2 status`)
- [ ] Logs ok (`pm2 logs`)
- [ ] Firebase quotas ok
- [ ] Alerts configured
- [ ] Backup scheduled

---

## 🆘 Rollback Procedure

Se deploy fallisce:

```bash
# Opzione A: Firebase Hosting rollback
firebase hosting:rollback

# Opzione B: Git rollback
git revert HEAD
git push
# Re-deploy

# Opzione C: Restore previous Docker image
docker-compose down
docker tag scorely-api:previous scorely-api:latest
docker-compose up -d
```

---

## 📞 Support

**Issues:** https://github.com/your-org/scorely/issues
**Docs:** https://your-domain.com/docs
**Email:** support@yourdomain.com

---

**Ultima modifica:** 2024-12-28
**Versione:** 1.0.0
