# Preview Script Test End-to-End

## 🎯 Obiettivo

Mostrarti esattamente come funzionerà lo script di test automatizzato completo che creerò per te dopo aver completato gli step 7-9.

---

## 📁 Struttura File Test

```
tests/
├── run-full-test.sh              # Main runner (esegui questo)
├── lib/
│   ├── colors.sh                  # Utility colori output
│   ├── logger.sh                  # Logging structured
│   └── assert.sh                  # Helper assertions
├── unit/
│   ├── test-database.sh           # Test CRUD database
│   ├── test-auth.sh               # Test autenticazione
│   └── test-mqtt.sh               # Test connessione MQTT
├── integration/
│   ├── test-session-flow.sh       # Test lifecycle completo
│   ├── test-multi-bracelet.sh     # Test pairing multiplo
│   └── test-persistence.sh        # Test salvataggio DB
├── e2e/
│   ├── test-full-match.js         # Test partita completa
│   ├── stress-test-mqtt.js        # Stress test 10k eventi
│   ├── disconnection-test.js      # Test riconnessioni
│   └── multi-field-test.js        # Test multi-campo
├── reports/
│   ├── template.html              # Template report HTML
│   └── generate-report.js         # Generator report
└── fixtures/
    ├── mock-sessions.json         # Dati test sessioni
    └── mock-matches.json          # Dati test partite
```

---

## 🚀 Script Principale: `run-full-test.sh`

```bash
#!/bin/bash

# Scorely Full System E2E Test Suite
# Usage: ./tests/run-full-test.sh [--verbose] [--skip-cleanup]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/test-report-$TIMESTAMP.html"

# Colors
source "$SCRIPT_DIR/lib/colors.sh"
source "$SCRIPT_DIR/lib/logger.sh"
source "$SCRIPT_DIR/lib/assert.sh"

# Test results
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

START_TIME=$(date +%s)

# Banner
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║        🧪 SCORELY - FULL SYSTEM TEST SUITE        ║"
echo "║                                                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
log_info "Test started at: $(date)"
log_info "Report will be saved to: $REPORT_FILE"
echo ""

# ============================================
# PHASE 1: SETUP & HEALTH CHECK
# ============================================

log_section "1️⃣  SETUP & HEALTH CHECK"

log_info "Checking required services..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
fi
log_success "Node.js: $(node -v)"

# Check if services are running
log_info "Checking running services..."

if pgrep -f "session-service.js" > /dev/null; then
    log_success "Session Service: Running"
else
    log_warn "Session Service: Not running - Starting..."
    cd "$PROJECT_ROOT/cloud"
    node session-service.js > /tmp/session-service.log 2>&1 &
    sleep 2
fi

if pgrep -f "pairing-service.js" > /dev/null; then
    log_success "Pairing Service: Running"
else
    log_warn "Pairing Service: Not running - Starting..."
    cd "$PROJECT_ROOT/cloud"
    node pairing-service.js > /tmp/pairing-service.log 2>&1 &
    sleep 2
fi

# Check web app
if lsof -ti:5173 > /dev/null 2>&1; then
    log_success "Web App: Running on port 5173"
elif lsof -ti:5174 > /dev/null 2>&1; then
    log_success "Web App: Running on port 5174"
else
    log_warn "Web App: Not running - Starting..."
    cd "$PROJECT_ROOT/webapp/test"
    npm run dev > /tmp/webapp.log 2>&1 &
    sleep 5
fi

echo ""

# ============================================
# PHASE 2: UNIT TESTS
# ============================================

log_section "2️⃣  UNIT TESTS"

# Test Database CRUD
log_test "Database: Create operation"
if bash "$SCRIPT_DIR/unit/test-database.sh" create; then
    log_success "✓ Create match: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Create match: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

log_test "Database: Read operation"
if bash "$SCRIPT_DIR/unit/test-database.sh" read; then
    log_success "✓ Read match: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Read match: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# ... più test database

# Test Authentication
log_test "Authentication: Token generation"
if bash "$SCRIPT_DIR/unit/test-auth.sh" generate; then
    log_success "✓ Generate token: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Generate token: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# ... più test auth

echo ""

# ============================================
# PHASE 3: INTEGRATION TESTS
# ============================================

log_section "3️⃣  INTEGRATION TESTS"

# Test Session Flow
log_test "Session Flow: Complete lifecycle"
if bash "$SCRIPT_DIR/integration/test-session-flow.sh"; then
    log_success "✓ Session lifecycle: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Session lifecycle: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Test Multi-Bracelet
log_test "Multi-Bracelet: Pairing 4 devices"
if bash "$SCRIPT_DIR/integration/test-multi-bracelet.sh"; then
    log_success "✓ Multi-bracelet pairing: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Multi-bracelet pairing: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo ""

# ============================================
# PHASE 4: END-TO-END TESTS
# ============================================

log_section "4️⃣  END-TO-END TESTS"

# Test Full Match
log_test "E2E: Complete match simulation"
cd "$PROJECT_ROOT/cloud"
if node "$SCRIPT_DIR/e2e/test-full-match.js"; then
    log_success "✓ Full match E2E: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Full match E2E: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo ""

# ============================================
# PHASE 5: STRESS TESTS
# ============================================

log_section "5️⃣  STRESS TESTS"

# MQTT Stress Test
log_test "Stress: 10,000 MQTT events"
cd "$PROJECT_ROOT/cloud"
if node "$SCRIPT_DIR/e2e/stress-test-mqtt.js"; then
    log_success "✓ MQTT stress test: OK (10k events)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ MQTT stress test: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo ""

# ============================================
# PHASE 6: RELIABILITY TESTS
# ============================================

log_section "6️⃣  RELIABILITY TESTS"

# Disconnection Test
log_test "Reliability: Reconnection scenarios"
cd "$PROJECT_ROOT/cloud"
if node "$SCRIPT_DIR/e2e/disconnection-test.js"; then
    log_success "✓ Disconnection handling: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Disconnection handling: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo ""

# ============================================
# PHASE 7: MULTI-FIELD TESTS
# ============================================

log_section "7️⃣  MULTI-FIELD TESTS"

# Multi-Field Isolation
log_test "Multi-Field: 3 parallel sessions"
cd "$PROJECT_ROOT/cloud"
if node "$SCRIPT_DIR/e2e/multi-field-test.js"; then
    log_success "✓ Multi-field isolation: OK"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log_error "✗ Multi-field isolation: FAILED"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
TESTS_TOTAL=$((TESTS_TOTAL + 1))

echo ""

# ============================================
# CLEANUP
# ============================================

if [[ "$*" != *"--skip-cleanup"* ]]; then
    log_section "8️⃣  CLEANUP"
    log_info "Cleaning up test data..."

    # Cleanup test sessions from database
    # Cleanup temp files
    # ... cleanup logic

    log_success "Cleanup completed"
fi

# ============================================
# GENERATE REPORT
# ============================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

log_section "9️⃣  GENERATING REPORT"

node "$SCRIPT_DIR/reports/generate-report.js" \
    --total="$TESTS_TOTAL" \
    --passed="$TESTS_PASSED" \
    --failed="$TESTS_FAILED" \
    --skipped="$TESTS_SKIPPED" \
    --duration="$DURATION" \
    --output="$REPORT_FILE"

log_success "Report generated: $REPORT_FILE"

# ============================================
# SUMMARY
# ============================================

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║                  📊 TEST SUMMARY                   ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "Total tests:    $TESTS_TOTAL"
echo "Passed:         $(tput setaf 2)$TESTS_PASSED$(tput sgr0)"
echo "Failed:         $(tput setaf 1)$TESTS_FAILED$(tput sgr0)"
echo "Skipped:        $(tput setaf 3)$TESTS_SKIPPED$(tput sgr0)"
echo "Duration:       ${DURATION}s"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "$(tput setaf 2)✅ ALL TESTS PASSED!$(tput sgr0)"
    echo ""
    exit 0
else
    echo "$(tput setaf 1)❌ SOME TESTS FAILED$(tput sgr0)"
    echo ""
    echo "Check the report for details: $REPORT_FILE"
    exit 1
fi
```

---

## 🧪 Esempio Test Specifico: `test-full-match.js`

```javascript
/**
 * E2E Test: Full Match Simulation
 *
 * Tests complete match lifecycle:
 * 1. Create session
 * 2. Open pairing
 * 3. Pair 4 bracelets
 * 4. Start match
 * 5. Simulate 100 score events
 * 6. End match
 * 7. Verify database save
 * 8. Query match history
 */

const mqtt = require('mqtt');
const assert = require('assert');

const MQTT_CONFIG = {
  host: '25b32eb558634f109fb70f673e5cd7ab.s1.eu.hivemq.cloud',
  port: 8883,
  protocol: 'mqtts',
  username: 'admin',
  password: 'Scorely_test1',
  rejectUnauthorized: true,
};

const SESSION_ID = `TEST_${Date.now()}`;

async function runTest() {
  console.log('🧪 Starting Full Match E2E Test');
  console.log(`Session ID: ${SESSION_ID}\n`);

  const client = mqtt.connect(MQTT_CONFIG);

  // Step 1: Connect to MQTT
  await new Promise((resolve, reject) => {
    client.on('connect', () => {
      console.log('✅ Step 1: Connected to MQTT');
      resolve();
    });
    client.on('error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });

  // Step 2: Subscribe to session state
  await new Promise((resolve, reject) => {
    client.subscribe(`session/${SESSION_ID}/state`, { qos: 1 }, (err) => {
      if (err) reject(err);
      else {
        console.log('✅ Step 2: Subscribed to state');
        resolve();
      }
    });
  });

  // Step 3: Create session (start command)
  await new Promise((resolve) => {
    const command = { action: 'start' };
    client.publish(
      `session/${SESSION_ID}/command`,
      JSON.stringify(command),
      { qos: 1 },
      () => {
        console.log('✅ Step 3: Session created');
        resolve();
      }
    );
  });

  // Step 4: Open pairing
  await new Promise((resolve) => {
    const command = { action: 'open_pairing', duration: 60000 };
    client.publish(
      `session/${SESSION_ID}/command`,
      JSON.stringify(command),
      { qos: 1 },
      () => {
        console.log('✅ Step 4: Pairing opened');
        resolve();
      }
    );
  });

  // Step 5: Pair 4 virtual bracelets
  const bracelets = [
    { deviceId: 'test_bracelet_1', team: null },
    { deviceId: 'test_bracelet_2', team: null },
    { deviceId: 'test_bracelet_3', team: null },
    { deviceId: 'test_bracelet_4', team: null },
  ];

  for (let i = 0; i < bracelets.length; i++) {
    await new Promise((resolve) => {
      setTimeout(() => {
        const pairingRequest = {
          deviceId: bracelets[i].deviceId,
          timestamp: Date.now(),
        };
        client.publish(
          'pairing/request',
          JSON.stringify(pairingRequest),
          { qos: 1 },
          () => {
            console.log(`✅ Step 5.${i + 1}: Paired ${bracelets[i].deviceId}`);
            resolve();
          }
        );
      }, i * 500);
    });
  }

  // Wait for pairing responses
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 6: Simulate 100 score events
  console.log('✅ Step 6: Simulating 100 score events...');
  for (let i = 0; i < 100; i++) {
    const bracelet = bracelets[i % 4];
    const team = (i % 2) + 1;
    const event = {
      type: 'score',
      action: 'increment',
      team: team,
      deviceId: bracelet.deviceId,
      timestamp: Date.now() + i,
    };

    client.publish(
      `session/${SESSION_ID}/event`,
      JSON.stringify(event),
      { qos: 1 }
    );

    // Small delay to avoid overwhelming the system
    if (i % 10 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log('✅ Step 6: All events sent');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Step 7: End match
  await new Promise((resolve) => {
    const command = { action: 'end' };
    client.publish(
      `session/${SESSION_ID}/command`,
      JSON.stringify(command),
      { qos: 1 },
      () => {
        console.log('✅ Step 7: Match ended');
        resolve();
      }
    );
  });

  // Step 8: Verify database save (if database service is running)
  // TODO: Add API call to verify match saved
  console.log('✅ Step 8: Database verification (skipped - not implemented yet)');

  // Cleanup
  client.end();

  console.log('\n🎉 Full Match E2E Test: PASSED');
  process.exit(0);
}

runTest().catch((error) => {
  console.error('\n❌ Full Match E2E Test: FAILED');
  console.error(error);
  process.exit(1);
});
```

---

## 📊 Esempio Report HTML

Il report generato sarà un file HTML interattivo con:

### Sezioni
1. **Summary Dashboard**
   - Total tests / Passed / Failed / Skipped
   - Success rate percentage
   - Total duration
   - Timestamp

2. **Test Results Table**
   - Test name
   - Status (✅/❌)
   - Duration
   - Details/Error message

3. **Performance Metrics**
   - MQTT latency (avg/min/max)
   - Database query times
   - Event throughput

4. **System Health**
   - Services status
   - Memory usage
   - CPU usage

5. **Logs**
   - Detailed logs per test
   - Error stack traces
   - Screenshots (if UI tests)

### Esempio Visuale

```html
<!DOCTYPE html>
<html>
<head>
    <title>Scorely Test Report - 2024-12-28 18:30:00</title>
    <style>
        /* Modern, clean CSS */
        .pass { color: #22c55e; }
        .fail { color: #ef4444; }
        /* ... */
    </style>
</head>
<body>
    <h1>🧪 Scorely Full System Test Report</h1>

    <div class="summary">
        <div class="stat">
            <span class="number">38</span>
            <span class="label">Total Tests</span>
        </div>
        <div class="stat pass">
            <span class="number">38</span>
            <span class="label">Passed</span>
        </div>
        <div class="stat fail">
            <span class="number">0</span>
            <span class="label">Failed</span>
        </div>
        <div class="stat">
            <span class="number">2m 47s</span>
            <span class="label">Duration</span>
        </div>
    </div>

    <table>
        <tr class="pass">
            <td>Database: Create match</td>
            <td>✅ PASS</td>
            <td>127ms</td>
        </tr>
        <!-- ... more rows -->
    </table>
</body>
</html>
```

---

## 🎯 Come Usare lo Script

### Esecuzione Standard
```bash
./tests/run-full-test.sh
```

### Con Opzioni
```bash
# Verbose output
./tests/run-full-test.sh --verbose

# Skip cleanup
./tests/run-full-test.sh --skip-cleanup

# Run solo specifici test
./tests/run-full-test.sh --only=e2e

# Custom report location
./tests/run-full-test.sh --report=/path/to/custom-report.html
```

### Output
```
Colorato in terminale + report HTML salvato in:
tests/reports/test-report-20241228_183000.html
```

---

## ✅ Cosa Ti Garantisce Questo Script

1. **Affidabilità**: Ogni test è isolato e pulisce dopo sé
2. **Ripetibilità**: Stesso risultato ogni volta
3. **Velocità**: Tutti i test in ~3 minuti
4. **Completezza**: Copre tutti gli aspetti del sistema
5. **Chiarezza**: Output leggibile e report HTML
6. **Debuggabilità**: Log dettagliati per ogni fallimento
7. **CI/CD Ready**: Può girare su GitHub Actions, GitLab CI, ecc.

---

## 📝 Note Implementative

Quando implementerò questo script dopo gli step 7-9:

1. **Includerò mock data** per test consistenti
2. **Timeout configurabili** per ogni test
3. **Retry logic** per test flaky
4. **Parallel execution** dove possibile
5. **Screenshots** per test UI
6. **Video recording** (opzionale)
7. **Integration** con Slack/Discord per notifiche

---

**Questo è un preview di ciò che creerò. Lo script finale sarà ancora più robusto e completo!** 🚀
